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
  
  if (!user) {
    throw new Error('User not registered as an ASHA worker. Contact administrator to register your phone.');
  }

  const otp = generateRandomOTP();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  user.otp = otp;
  user.otpExpires = otpExpires;
  await user.save();

  // Send real SMS only if explicitly enabled in .env (for demo/production)
  if (process.env.TWILIO_SEND_OTP === 'true') {
    try {
      const message = `Namaste! Your Swasthya Sathi login OTP is: ${otp}. Valid for 10 minutes.`;
      await sendSMS(formattedPhone, message);
      console.log(`[OTP] Twilio SMS successfully sent to ${formattedPhone}`);
    } catch (err) {
      console.error(`[OTP ERROR] Twilio Send Failed: ${err.message}`);
      // Don't crash if SMS fails in dev, just keep logs
    }
  } else {
    console.log(`[OTP DEBUG] TWILIO_SEND_OTP is disabled. OTP for ${formattedPhone}: ${otp}`);
  }

  return { 
    message: 'OTP sent to mobile number', 
    otp: process.env.NODE_ENV === 'development' ? otp : undefined // only expose in dev
  };
};

export const loginWithOTP = async (phone, otp) => {
  // Normalize phone for regex matching
  const cleanPhone = phone.replace(/\s/g, '').replace(/^\+91/, '').replace(/^\+/, '');
  const user = await User.findOne({ phone: { $regex: cleanPhone } });

  if (!user) {
    throw new Error('User not found. Cannot verify OTP.');
  }

  // ALLOW SHORTHAND BYPASS FOR DEMOS IN DEVELOPMENT
  const isDevBypass = process.env.NODE_ENV === 'development' && otp === '123456';

  if (!isDevBypass && (!user.otp || user.otp !== otp || user.otpExpires < Date.now())) {
    throw new Error('Invalid or expired OTP');
  }

  // Clear OTP after successful use
  user.otp = undefined;
  user.otpExpires = undefined;
  await user.save();

  const token = generateToken(user._id);
  return {
    _id: user._id,
    name: user.name,
    phone: user.phone,
    role: user.role,
    region: user.region || 'Palghar',
    token, // Send token back
  };
};

export const getUserProfile = async (userId) => {
  const user = await User.findById(userId).select('-otp -otpExpires');
  if (!user) {
    throw new Error('User not found');
  }
  return user;
};
