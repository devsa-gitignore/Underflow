import asyncHandler from 'express-async-handler';
import { v4 as uuidv4 } from 'uuid';
import * as voiceService from '../services/voice.service.js';
import { translationQueue } from '../queues/translation.queue.js';
import translationStore from '../store/translationStore.js';

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

// @desc    Translate audio asynchronously using BullMQ
// @route   POST /voice/translate
// @access  Private
// @body    form-data: audio (file)
export const translateAudio = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('No audio file found. Send a file with field name "audio" as form-data.');
  }

  // 1. Generate unique job ID
  const jobId = uuidv4();

  // 2. Initialize in-memory store for this job
  translationStore[jobId] = { status: 'queued' };

  // 3. Add to BullMQ queue using file path
  await translationQueue.add('translateAudio', { 
    jobId, 
    filePath: req.file.path,
    originalname: req.file.originalname 
  });

  // 4. Return accepted status to client
  res.status(202).json({ jobId, status: 'queued' });
});

// @desc    Retrieve translation result logic
// @route   GET /voice/translate/:jobId
// @access  Private
export const getTranslationStatus = asyncHandler(async (req, res) => {
  const { jobId } = req.params;

  const jobInfo = translationStore[jobId];

  if (!jobInfo) {
    res.status(404);
    throw new Error('Translation job not found.');
  }

  res.status(200).json(jobInfo);
});

