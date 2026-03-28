import * as ttsIntegration from '../integrations/tts.js';
import Patient from '../models/Patient.js';

const isMock = process.env.COMM_MODE === 'mock' || !process.env.COMM_MODE;

const getTwilioIntegration = async () => import('../integrations/twilio.js');

export const sendSMS = async (phone, message) => {
  if (isMock) {
    console.log(`[MOCK SMS] To ${phone}: "${message}"`);
    return { success: true, mode: 'mock', messageId: 'MOCK_SMS_123' };
  }

  const twilioIntegration = await getTwilioIntegration();
  return twilioIntegration.sendSMS(phone, message);
};

export const generateTTS = async (text) => {
  return ttsIntegration.generateTTS(text);
};

export const startIVRCall = async (phone) => {
  if (isMock) {
    console.log(`[MOCK IVR CALL] To ${phone}`);
    return { success: true, mode: 'mock', callSid: 'MOCK_CALL_123' };
  }

  const twilioIntegration = await getTwilioIntegration();
  return twilioIntegration.startIVRCall(phone);
};

export const handleMissedCall = async (fromPhone) => {
  console.log(`[MISSED CALL RECEIVED] From: ${fromPhone}`);

  const cleanPhone = fromPhone.replace(/^\+91/, '').replace(/^\+/, '');
  const patient = await Patient.findOne({ phone: { $regex: cleanPhone } });

  let message = '';
  if (patient) {
    message = `Namaste ${patient.name}. We noticed you called Swasthya Sathi. Your risk level is currently ${patient.currentRiskLevel}. Please ensure you take your regular checkups.`;
  } else {
    message =
      'Namaste. Thank you for calling Swasthya Sathi. We noticed this is an unregistered number. Please visit your local ASHA worker for registration.';
  }

  if (isMock) {
    console.log(`[CALLBACK LOGIC] Preparing automated response for ${patient ? patient.name : 'Unknown'}`);
  }

  const audioUrl = await ttsIntegration.generateTTS(message);
  const result = await startIVRCall(fromPhone, audioUrl);

  return {
    success: true,
    patientIdentified: !!patient,
    messageSent: message,
    callbackResult: result,
  };
};
