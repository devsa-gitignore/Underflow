import express from 'express';
import {
  sendSMS,
  generateTTS,
  startIVRCall,
  handleMissedCallWebhook,
  handleSMSWebhook,
  handleLanguageSelection,
  handleSymptomRecording
} from '../controllers/communication.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Routes for Communication system

// Webhook for incoming caller event
// Public endpoint for Twilio
router.post('/missed-call/webhook', handleMissedCallWebhook);
router.post('/sms/webhook', handleSMSWebhook);

// Protected routes for general communication
//router.use(protect);

router.post('/sms', sendSMS);
router.post('/tts', generateTTS);
router.post('/ivr/start', startIVRCall);

// Complete IVR Flow Routes
router.post('/ivr/language', handleLanguageSelection);
router.post('/ivr/symptoms', handleSymptomRecording);

export default router;
