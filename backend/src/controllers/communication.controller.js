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

// @desc    Start IVR outbound call / initial response
// @route   POST /comm/ivr/start
// @access  Public (for Twilio wehooks)
export const startIVRCall = asyncHandler(async (req, res) => {
  const { phone } = req.body; // If manually triggered
  const fromPhone = req.body.From; // If incoming callback/trigger

  const voiceResponse = commsService.getLanguagePromptTwiML();

  res.set('Content-Type', 'text/xml');
  res.status(200).send(voiceResponse);
});

// @desc    Handle language selection step
// @route   POST /comm/ivr/language
export const handleLanguageSelection = asyncHandler(async (req, res) => {
  const digits = req.body.Digits;
  
  const voiceResponse = commsService.getSymptomPromptTwiML(digits);

  res.set('Content-Type', 'text/xml');
  res.status(200).send(voiceResponse);
});

// @desc    Handle symptom recording and end call
// @route   POST /comm/ivr/symptoms
export const handleSymptomRecording = asyncHandler(async (req, res) => {
  // If the call was initiated by Twilio (outbound-api), the patient is the 'To' number.
  // If the patient called Twilio (inbound), the patient is the 'From' number.
  const direction = req.body.Direction;
  const patientPhone = direction === 'outbound-api' ? req.body.To : req.body.From;
  const recordingUrl = req.body.RecordingUrl;
  const languageCode = req.query.lang || 'en';

  console.log(`\n--- 🎤 RECORDING RECEIVED ---`);
  console.log(`👤 Patient Phone: ${patientPhone}`);
  console.log(`🔗 Recording URL: ${recordingUrl || 'NONE'}`);

  // 1. Send immediate response to user to conclude the call
  const voiceResponse = commsService.getConclusionTwiML(languageCode);
  res.set('Content-Type', 'text/xml');
  res.status(200).send(voiceResponse);

  // 2. Process everything else in the background
  if (patientPhone && recordingUrl) {
    commsService.processIVRSymptoms(patientPhone, recordingUrl, languageCode)
      .then(() => console.log(`✅ Automated IVR Analysis complete for ${patientPhone}`))
      .catch(err => console.error(`❌ IVR Background process error for ${patientPhone}:`, err.message));
  } else {
    console.warn(`[IVR] Skipping background process. Check params (PatientPhone: ${patientPhone}, URL: ${recordingUrl})`);
  }
});

// @desc    Handle Missed Call Webhook (Twilio or simulated)
// @route   POST /comm/missed-call/webhook
// @access  Public
export const handleMissedCallWebhook = (req, res) => {
  const fromPhone = req.body.From;

  // 1. Log for visibility during demo
  console.log(`\n--- 📵 INCOMING MISSED CALL WEBHOOK ---`);
  console.log(`👤 Caller: ${fromPhone || 'Unknown'}`);

  // 2. Respond to Twilio INSTANTLY with a Busy/Reject signal
  res.set('Content-Type', 'text/xml');
  res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?><Response><Reject reason="busy" /></Response>`);

  // 3. Trigger the callback logic in the background
  if (fromPhone) {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const baseUrl = `${protocol}://${req.get('host')}`;
    commsService.handleMissedCall(fromPhone, baseUrl)
      .then(() => console.log(`✅ Automated IVR Callback initiated for: ${fromPhone}`))
      .catch(err => console.error(`❌ Callback failed for ${fromPhone}:`, err.message));
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
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const baseUrl = `${protocol}://${req.get('host')}`;
    commsService.handleMissedCall(fromPhone, baseUrl)
      .then(() => console.log(`✅ Automated IVR Callback triggered via SMS for: ${fromPhone}`))
      .catch(err => console.error(`❌ SMS Callback failed for ${fromPhone}:`, err.message));
  }
};