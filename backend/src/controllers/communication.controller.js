import asyncHandler from 'express-async-handler';
import * as commsService from '../services/communication.service.js';

// @desc    Send SMS
// @route   POST /comm/sms
// @access  Private
export const sendSMS = asyncHandler(async (req, res) => {
  const { phone, message } = req.body;

  if (!phone || !message) {
    res.status(400);
    throw new Error('Please provide phone and message');
  }

  const result = await commsService.sendSMS(phone, message);
  res.status(200).json({ success: true, result });
});

// @desc    Generate TTS Audio URL
// @route   POST /comm/tts
// @access  Private
export const generateTTS = asyncHandler(async (req, res) => {
  const { text } = req.body;

  if (!text) {
    res.status(400);
    throw new Error('Please provide text to convert');
  }

  const audioUrl = await commsService.generateTTS(text);
  res.status(200).json({ success: true, audioUrl });
});

// @desc    Start IVR outbound call
// @route   POST /comm/ivr/start
// @access  Private
export const startIVRCall = asyncHandler(async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    res.status(400);
    throw new Error('Please provide phone');
  }

  const result = await commsService.startIVRCall(phone);
  res.status(200).json({ success: true, result });
});

// @desc    Handle Missed Call Webhook (Twilio or simulated)
// @route   POST /comm/missed-call/webhook
// @access  Public
export const handleMissedCallWebhook = asyncHandler(async (req, res) => {
  // Twilio uses 'From' for incoming callers. We can handle both 'From' and 'phone'.
  const fromPhone = req.body.From || req.body.phone;

  if (!fromPhone) {
    res.status(400);
    throw new Error('No phone number provider in webhook body');
  }

  const result = await commsService.handleMissedCall(fromPhone);
  res.status(200).json({ success: true, message: 'Missed Call Callback Triggered', result });
});
