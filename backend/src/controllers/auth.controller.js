import asyncHandler from 'express-async-handler';
import * as authService from '../services/auth.service.js';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';

// @desc    Send OTP to phone
// @route   POST /auth/send-otp
// @access  Public
export const sendOTP = asyncHandler(async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    res.status(400);
    throw new Error('Please provide a phone number');
  }

  const result = await authService.sendOTP(phone);
  res.status(200).json(result);
});

// @desc    Login/Verify OTP
// @route   POST /auth/login
// @access  Public
export const login = asyncHandler(async (req, res) => {
  const { phone, otp } = req.body;

  if (!phone || !otp) {
    res.status(400);
    throw new Error('Please provide phone number and OTP');
  }

  const result = await authService.loginWithOTP(phone, otp);
  res.status(200).json(result);
});

// @desc    Get current user profile
// @route   GET /auth/me
// @access  Private
export const getMe = asyncHandler(async (req, res) => {
  // User is already attached by protect middleware
  res.status(200).json(req.user);
});

// @desc    Generate a dev token immediately
export const devToken = asyncHandler(async (req, res) => {
  const user = await User.findOne({ name: 'Jash Nikombhe' });
  if (!user) {
    res.status(404);
    throw new Error('Jash Nikombhe not found. Run the seed script first.');
  }
  const token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET || 'your_fallback_secret_key',
    { expiresIn: '30d' }
  );
  res.status(200).json({
    _id: user._id,
    name: user.name,
    phone: user.phone,
    role: user.role,
    token, // Send token back
  });
});
