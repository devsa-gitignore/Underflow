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
// @desc    Handle Missed Call Webhook (Twilio or simulated)
// @route   POST /comm/missed-call/webhook
// @access  Public
export const handleMissedCallWebhook = (req, res) => {
  const fromPhone = req.body.From;

  // 1. Log for visibility during demo
  console.log(`\n--- 📵 INCOMING MISSED CALL WEBHOOK ---`);
  console.log(`👤 Caller: ${fromPhone || 'Unknown'}`);

  // 2. Respond to Twilio INSTANTLY with a Busy/Reject signal
  // This minimizes "answering" time
  res.set('Content-Type', 'text/xml');
  res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?><Response><Reject reason="busy" /></Response>`);

  // 3. Trigger the callback logic in the background
  if (fromPhone) {
    commsService.handleMissedCall(fromPhone)
      .then(() => console.log(`✅ Automated IVR Callback initiated for: ${fromPhone}`))
      .catch(err => console.error(`❌ Callback failed for ${fromPhone}:`, err.message));
  } else {
    // If it's a direct API test (not from Twilio)
    const phone = req.body.phone;
    if (phone) {
       commsService.handleMissedCall(phone)
         .then(() => console.log('✅ Simulation success'))
         .catch(err => console.error('❌ Simulation error:', err));
    }
  }
};

// @desc    Handle Incoming SMS Webhook
// @route   POST /comm/sms/webhook
// @access  Public
export const handleSMSWebhook = (req, res) => {
  const fromPhone = req.body.From;
  const body = req.body.Body;

  // 1. Log incoming SMS
  console.log(`\n--- 📩 INCOMING SMS WEBHOOK ---`);
  console.log(`👤 From: ${fromPhone}`);
  console.log(`💬 Message: "${body}"`);

  // 2. Respond with empty TwiML (Required by Twilio)
  res.set('Content-Type', 'text/xml');
  res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`);

  // 3. Trigger the SAME callback logic as the missed call!
  if (fromPhone) {
    commsService.handleMissedCall(fromPhone)
      .then(() => console.log(`✅ Automated IVR Callback triggered via SMS for: ${fromPhone}`))
      .catch(err => console.error(`❌ SMS Callback failed for ${fromPhone}:`, err.message));
  }
};