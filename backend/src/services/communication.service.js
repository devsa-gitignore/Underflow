import * as twilioIntegration from '../integrations/twilio.js';
import * as ttsIntegration from '../integrations/tts.js';
import Patient from '../models/Patient.js';

const isMock = process.env.COMM_MODE === 'mock' || !process.env.COMM_MODE;

/**
 * Sends a standard SMS to a patient.
 */
export const sendSMS = async (phone, message) => {
  if (isMock) {
    console.log(`📩 [MOCK SMS] To ${phone}: "${message}"`);
    return { success: true, mode: 'mock', messageId: 'MOCK_SMS_123' };
  }

  return await twilioIntegration.sendSMS(phone, message);
};

/**
 * Generates an audio URL from text via TTS.
 */
export const generateTTS = async (text) => {
  // In a real scenario, this would call Google/ElevenLabs
  return await ttsIntegration.generateTTS(text);
};

/**
 * Starts an outbound IVR call to a patient.
 */
export const startIVRCall = async (phone) => {
  if (isMock) {
    console.log(`📞 [MOCK IVR CALL] To ${phone}`);
    return { success: true, mode: 'mock', callSid: 'MOCK_CALL_123' };
  }

  // Twilio needs a TwiML response or a URL that serves the TwiML
  // For the hackathon, we can use Twilio binary TwiML or a dedicated redirect
  // For now, assume url is a direct link to the audio or a TwiML hosted XML.
  return await twilioIntegration.startIVRCall(phone);
};

/**
 * --- CORE WORKFLOW ---
 * Missed Call Callback system
 */
export const handleMissedCall = async (fromPhone) => {
  console.log(`📵 [MISSED CALL RECIEVED] From: ${fromPhone}`);

  // 1. Clean the phone number to match database (removing + prefixes)
  const cleanPhone = fromPhone.replace(/^\+91/, '').replace(/^\+/, '');

  // 2. Identify the patient for this phone number
  // Schema uses 'phoneNumber', searching by name and age isn't enough - we need phone exactly.
  const patient = await Patient.findOne({ phoneNumber: { $regex: cleanPhone } });

  let message = '';
  if (patient) {
    message = `Namaste ${patient.name}. We noticed you called Swasthya Sathi. Your risk level is currently ${patient.currentRiskLevel}. Please ensure you take your regular checkups.`;
  } else {
    message = "Namaste. Thank you for calling Swasthya Sathi. We noticed this is an unregistered number. Please visit your local ASHA worker for registration.";
  }

  if (isMock) {
    console.log(`💡 [CALLBACK LOGIC] Preparing automated response for ${patient ? patient.name : 'Unknown'}`);
  }

  // 3. Generate the TTS audio URL
  const audioUrl = await ttsIntegration.generateTTS(message);

  // 4. Trigger the Automated IVR Callback
  const result = await startIVRCall(fromPhone, audioUrl);

  return {
    success: true,
    patientIdentified: !!patient,
    messageSent: message,
    callbackResult: result,
  };
};
