import asyncHandler from 'express-async-handler';
import * as authService from '../services/auth.service.js';

// @desc    Send OTP to phone
// @route   POST /auth/send-otp
// @access  Public
export const sendOTP = asyncHandler(async (req, res) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    res.status(400);
    throw new Error('Please provide a phone number');
  }

  const result = await authService.sendOTP(phoneNumber);
  res.status(200).json(result);
});

// @desc    Login/Verify OTP
// @route   POST /auth/login
// @access  Public
export const login = asyncHandler(async (req, res) => {
  const { phoneNumber, otp } = req.body;

  if (!phoneNumber || !otp) {
    res.status(400);
    throw new Error('Please provide phone number and OTP');
  }

  const result = await authService.loginWithOTP(phoneNumber, otp);
  res.status(200).json(result);
});

// @desc    Get current user profile
// @route   GET /auth/me
// @access  Private
export const getMe = asyncHandler(async (req, res) => {
  // User is already attached by protect middleware
  res.status(200).json(req.user);
});
