import * as twilioIntegration from '../integrations/twilio.js';
import * as ttsIntegration from '../integrations/tts.js';
import * as voiceService from './voice.service.js';
import Patient from '../models/Patient.js';
import Visit from '../models/Visit.js';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { AUDIO_DIR } from '../middlewares/upload.middleware.js';

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
export const startIVRCall = async (phone, audioUrl, baseUrl) => {
  if (isMock) {
    console.log(`📞 [MOCK IVR CALL] To ${phone} with audio: ${audioUrl || 'Default'}`);
    return { success: true, mode: 'mock', callSid: 'MOCK_CALL_123' };
  }
  return await twilioIntegration.startIVRCall(phone, audioUrl, baseUrl);
};

// --- IVR TwiML GENERATION ---

/**
 * Stage 1: Ask for language
 */
export const getLanguagePromptTwiML = () => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Aditi" language="en-IN">
    Namaste. Welcome to Swasthya Sathi.
    Please select your language.
    Press 1 for English.
    Press 2 for Hindi.
    Press 3 for Marathi.
  </Say>
  <Gather action="/comm/ivr/language" numDigits="1" timeout="10" />
  <Redirect>/comm/ivr/start</Redirect>
</Response>`;
};

/**
 * Stage 2: Ask for symptoms based on language
 */
export const getSymptomPromptTwiML = (digits) => {
  const langMap = {
    '1': { code: 'en', voice: 'Polly.Aditi', twilioLang: 'en-IN', say: 'Please describe your symptoms after the beep. Press hash when done.' },
    '2': { code: 'hi', voice: 'Polly.Aditi', twilioLang: 'hi-IN', say: 'Kripaya beep ke baad apne lakshano ka varnan kare. Samapt hone par hash dabaye.' },
    '3': { code: 'mr', voice: 'Google.mr-IN-Wavenet-A', twilioLang: 'mr-IN', say: 'Krupaya beep nantar tumchi lakshane sanga. Samplya var hash dabava.' }
  };

  const choice = langMap[digits] || langMap['1'];

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${choice.voice}" language="${choice.twilioLang}">
    ${choice.say}
  </Say>
  <Record 
    action="/comm/ivr/symptoms?lang=${choice.code}" 
    maxLength="60" 
    finishOnKey="#" 
    playBeep="true" 
  />
</Response>`;
};

/**
 * Stage 3: Conclusion
 */
export const getConclusionTwiML = (lang) => {
  const langMap = {
    'en': { voice: 'Polly.Aditi', twilioLang: 'en-IN', msg: 'Thank you. Your symptoms have been recorded. We will get back to you soon. Goodbye.' },
    'hi': { voice: 'Polly.Aditi', twilioLang: 'hi-IN', msg: 'Dhanyavad. Aapke lakshano ko record kar liya gaya hai. Hum jald hi aapse sampark karenge. Alvida.' },
    'mr': { voice: 'Google.mr-IN-Wavenet-A', twilioLang: 'mr-IN', msg: 'Dhanyavad. Tumchi lakshane record jhale ahet. Amhi lavkarach tumchyashi samparka karu. Goodbye.' }
  };

  const choice = langMap[lang] || langMap['en'];

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${choice.voice}" language="${choice.twilioLang}">
    ${choice.msg}
  </Say>
  <Hangup />
</Response>`;
};

// --- BACKGROUND PROCESSING ---

/**
 * Processes recording from IVR, transcribes with Whisper, analyzes risk with Gemini, and saves Visit.
 */
export const processIVRSymptoms = async (fromPhone, recordingUrl, languageCode) => {
  console.log(`[IVR-PROCESS] Starting async processing for ${fromPhone} | Lang: ${languageCode}`);

  try {
    // 1. Download basic patient info
    const cleanPhone = fromPhone.replace(/^\+91/, '').replace(/^\+/, '');
    const patient = await Patient.findOne({ phone: { $regex: cleanPhone } });

    if (!patient) {
      console.warn(`[IVR-PROCESS] No patient found for ${fromPhone}. Background analysis stopped.`);
      return;
    }

    // 2. Download audio from Twilio to local disk
    const audioFilename = `ivr_${Date.now()}.wav`;
    const audioPath = path.join(AUDIO_DIR, audioFilename);
    const finalRecordingUrl = recordingUrl.endsWith('.wav') ? recordingUrl : `${recordingUrl}.wav`;

    const response = await axios({
      method: 'GET',
      url: finalRecordingUrl,
      responseType: 'stream',
      auth: {
        username: process.env.TWILIO_ACCOUNT_SID,
        password: process.env.TWILIO_AUTH_TOKEN
      }
    });

    const writer = fs.createWriteStream(audioPath);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    console.log(`[IVR-PROCESS] Audio downloaded: ${audioPath}`);

    // 3. Transcribe using local Whisper
    const fileObj = { path: audioPath, filename: audioFilename };
    const { transcript } = await voiceService.transcribeAudio(fileObj, null, patient.ashaId, languageCode);
    console.log(`[IVR-PROCESS] Whisper Transcript: ${transcript}`);

    // 4. Save as a new Visit entry (Simplified - No AI)
    const visit = await Visit.create({
      patientId: patient._id,
      ashaId: patient.ashaId,
      symptoms: [], // Leave empty or put dummy if needed by schema
      notes: transcript, // Symptoms go directly into the notes field as requested
      riskLevel: patient.currentRiskLevel, // Maintain existing risk level
    });

    console.log(`[IVR-PROCESS] Visit created: ${visit._id} | Notes saved: ${transcript.substring(0, 30)}...`);

  } catch (err) {
    console.error(`[IVR-PROCESS] ERROR:`, err);
  }
};

export const handleMissedCall = async (fromPhone, baseUrl) => {
  console.log(`[MISSED CALL RECEIVED] From: ${fromPhone}`);

  const cleanPhone = fromPhone.replace(/^\+91/, '').replace(/^\+/, '');
  const patient = await Patient.findOne({ phone: { $regex: cleanPhone } });

  if (!patient) {
    console.warn(`[IVR] Caller ${fromPhone} is not found in Database. Aborting callback.`);
    return {
      success: false,
      patientIdentified: false,
      message: 'Unregistered patient, skipped IVR call'
    };
  }

  // 4. Trigger the Automated IVR Start flow
  const result = await startIVRCall(fromPhone, null, baseUrl);
  console.log("📞 Callback triggered:", result.sid || result);
  return {
    success: true,
    patientIdentified: true,
    callbackResult: result,
  };
};
