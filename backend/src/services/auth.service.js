import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import { generateRandomOTP } from '../utils/otp.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your_fallback_secret_key', {
    expiresIn: '30d',
  });
};

export const sendOTP = async (phoneNumber) => {
  // Find or create user? (Hackathon ease)
  // Let's check if the ASHA user exists
  let user = await User.findOne({ phoneNumber });
  
  if (!user && process.env.NODE_ENV === 'development') {
    console.log(`[AUTH DEBUG] Auto-creating ASHA worker for phone number: ${phoneNumber} (Development mode)`);
    user = await User.create({
      name: 'Test ASHA Worker',
      phoneNumber,
      village: 'Development Village',
      role: 'asha'
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

  // In real implementation, send via Twilio here
  // For now, return it (to help testing on postman)
  console.log(`[OTP DEBUG] Sent OTP ${otp} to ${phoneNumber}`);
  return { otp, message: 'OTP sent to mobile number' };
};

export const loginWithOTP = async (phoneNumber, otp) => {
  const user = await User.findOne({
    phoneNumber,
    otp,
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
    phoneNumber: user.phoneNumber,
    role: user.role,
    village: user.village,
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
