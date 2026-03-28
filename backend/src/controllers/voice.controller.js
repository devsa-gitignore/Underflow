import asyncHandler from 'express-async-handler';
import * as voiceService from '../services/voice.service.js';

// @desc    Upload an audio file to local disk
// @route   POST /voice/upload
// @access  Private
// @body    form-data: audio (file), patientId (string, optional)
export const uploadAudio = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('No audio file found. Send a file with field name "audio" as form-data.');
  }

  const patientId = req.body.patientId || null;

  const result = await voiceService.uploadAudio(
    req.file,
    req.user._id,
    patientId
  );

  res.status(201).json(result);
});

// @desc    Transcribe audio to text using local Whisper
// @route   POST /voice/transcribe
// @access  Private
// @body    form-data: audio (file), voiceLogId (string, optional)
// @note    voiceLogId: if provided, the transcript is saved to that VoiceLog
export const transcribeAudio = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('No audio file found. Send a file with field name "audio" as form-data.');
  }

  const voiceLogId = req.body.voiceLogId || null;
  // language: ISO 639-1 code. 'hi'=Hindi, 'mr'=Marathi, 'bn'=Bengali etc.
  // Defaults to 'hi'. Frontend can override per patient's known language.
  const language = req.body.language || 'hi';

  const result = await voiceService.transcribeAudio(req.file, voiceLogId, req.user._id, language);

  res.status(200).json(result);
});

// @desc    Translate audio (any Indian language) → English using local Whisper
// @route   POST /voice/translate
// @access  Private
// @body    form-data: audio (file)
export const translateAudio = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('No audio file found. Send a file with field name "audio" as form-data.');
  }

  const result = await voiceService.translateAudio(req.file);
  res.status(200).json(result);
});
