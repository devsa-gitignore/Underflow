import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import { generateRandomOTP } from '../utils/otp.js';
import { sendSMS } from '../integrations/twilio.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your_fallback_secret_key', {
    expiresIn: '30d',
  });
};

export const sendOTP = async (phone) => {
  // Use strictly clean phone for lookup to handle +91 consistency
  const cleanPhone = phone.replace(/\s/g, ''); 
  const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : `+91${cleanPhone}`;

  let user = await User.findOne({ phone: { $regex: cleanPhone.replace(/^\+91/, '').replace(/^\+/, '') } });
  
  if (!user && process.env.NODE_ENV === 'development') {
    console.log(`[AUTH DEBUG] Auto-creating ASHA worker for phone number: ${formattedPhone}`);
    user = await User.create({
      name: 'Test ASHA Worker',
      phone: formattedPhone,
      region: 'Development Region',
      role: 'ASHA'
    });
  }

  if (!user) {
    throw new Error('User not registered as an ASHA worker. Contact administrator.');
  }

  const otp = generateRandomOTP();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  user.otp = otp;
  user.otpExpires = otpExpires;
  await user.save();

  // Send the real SMS via Twilio
  try {
    const message = `Namaste! Your Swasthya Sathi login OTP is: ${otp}. Valid for 10 minutes.`;
    await sendSMS(formattedPhone, message);
    console.log(`[OTP] Twilio SMS successfully sent to ${formattedPhone}`);
  } catch (err) {
    console.error(`[OTP ERROR] Failed to send SMS to ${formattedPhone}:`, err.message);
    // In development, we don't throw so user can still see it in logs
    if (process.env.NODE_ENV !== 'development') {
      throw new Error('Failed to deliver OTP message via SMS. Please check phone number.');
    }
  }

  console.log(`[OTP DEBUG] Generated OTP ${otp} for ${formattedPhone}`);
  return { 
    message: 'OTP sent to mobile number', 
    otp: process.env.NODE_ENV === 'development' ? otp : undefined // only expose in dev
  };
};

export const loginWithOTP = async (phone, otp) => {
  // Use the same clean phone and formatted phone pattern as sendOTP
  const cleanPhone = phone.replace(/\s/g, ''); 
  const regexPattern = cleanPhone.replace(/^\+91/, '').replace(/^\+/, '');

  const user = await User.findOne({
    phone: { $regex: regexPattern },
    otp: otp.toString(),
    otpExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw new Error('Invalid or expired OTP');
  }

  // Clear OTP after successful login
  user.otp = undefined;
  user.otpExpires = undefined;
  user.isVerified = true;
  await user.save();

  const token = generateToken(user._id);

  return {
    _id: user._id,
    name: user.name,
    phone: user.phone,
    role: user.role,
    region: user.region,
    token,
  };
};

export const getUserProfile = async (userId) => {
  const user = await User.findById(userId).select('-otp -otpExpires');
  if (!user) {
    throw new Error('User not found');
  }
  return user;
};
