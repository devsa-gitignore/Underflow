import * as twilioIntegration from '../integrations/twilio.js';
import * as ttsIntegration from '../integrations/tts.js';
import Patient from '../models/Patient.js';

const isMock = process.env.COMM_MODE === 'mock' || !process.env.COMM_MODE;

export const sendSMS = async (phone, message) => {
  if (isMock) {
    console.log(`[MOCK SMS] To ${phone}: "${message}"`);
    return { success: true, mode: 'mock', messageId: 'MOCK_SMS_123' };
  }

  return twilioIntegration.sendSMS(phone, message);
};

export const generateTTS = async (text) => {
  return ttsIntegration.generateTTS(text);
};

/**
 * Starts an outbound IVR call to a patient.
 */
export const startIVRCall = async (phone, audioUrl) => {
  if (isMock) {
    console.log(`📞 [MOCK IVR CALL] To ${phone} with audio: ${audioUrl || 'Default'}`);
    return { success: true, mode: 'mock', callSid: 'MOCK_CALL_123' };
  }

  // Twilio needs a TwiML response or a URL that serves the TwiML
  // For the hackathon, we can use Twilio binary TwiML or a dedicated redirect
  // For now, assume url is a direct link to the audio or a TwiML hosted XML.
  return await twilioIntegration.startIVRCall(phone, audioUrl);
};

export const handleMissedCall = async (fromPhone) => {
  console.log(`[MISSED CALL RECEIVED] From: ${fromPhone}`);

  const cleanPhone = fromPhone.replace(/^\+91/, '').replace(/^\+/, '');

  // 2. Identify the patient for this phone number
  // Schema uses 'phone', searching by name and age isn't enough - we need phone exactly.
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

  // 3. Generate the TTS audio URL
  const audioUrl = null;

  // 4. Trigger the Automated IVR Callback
  const result = await startIVRCall(fromPhone, null);
  console.log("📞 Callback triggered:", result.sid || result);
  return {
    success: true,
    patientIdentified: !!patient,
    messageSent: message,
    callbackResult: result,
  };
};
