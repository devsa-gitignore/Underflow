import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import VoiceLog from '../models/VoiceLog.js';
import { AUDIO_DIR, TRANSCRIPT_DIR } from '../middlewares/upload.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─────────────────────────────────────────────────────────────────
// Helper: Run local Whisper CLI as child process
//
// whisper <audioPath>
//   --model base        (fast + accurate for Indian languages)
//   --language <lang>   (auto = let Whisper detect, or 'hi', 'mr' etc.)
//   --task <task>       ('transcribe' or 'translate')
//   --output_format txt (we only need plain text)
//   --output_dir <dir>  (where to write the .txt file)
//   --fp16 False        (disable half-precision on CPU — avoids errors)
//
// Returns: { stdout, stderr }
// ─────────────────────────────────────────────────────────────────
const runWhisper = (audioPath, task = 'transcribe', language = null) => {
  return new Promise((resolve, reject) => {
    const args = [
      audioPath,
      '--model', 'base',
      '--task', task,
      '--output_format', 'txt',
      '--output_dir', TRANSCRIPT_DIR,
      '--fp16', 'False',
    ];

    // Only specify language for transcription, not translation
    // For translation, Whisper auto-detects source language
    if (language && task === 'transcribe') {
      args.push('--language', language);
    }

    // Try 'whisper' first (if it's in PATH), fall back to 'python -m whisper'
    // We use WHISPER_CMD env var so it can be configured per deployment
    const whisperCmd = process.env.WHISPER_CMD || 'whisper';

    let cmd, cmdArgs;
    if (whisperCmd === 'python -m whisper') {
      cmd = 'python';
      cmdArgs = ['-m', 'whisper', ...args];
    } else {
      cmd = whisperCmd;
      cmdArgs = args;
    }

    console.log(`[WHISPER] Running: ${cmd} ${cmdArgs.join(' ')}`);

    let stdout = '';
    let stderr = '';

    const proc = spawn(cmd, cmdArgs, { shell: true });

    proc.stdout.on('data', (data) => { stdout += data.toString(); });
    proc.stderr.on('data', (data) => { stderr += data.toString(); });

    proc.on('error', (err) => {
      reject(new Error(`Failed to start Whisper process: ${err.message}. Make sure Whisper is installed and in PATH.`));
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`Whisper exited with code ${code}. Error: ${stderr}`));
      }
    });
  });
};

// ─────────────────────────────────────────────────────────────────
// Helper: Read the .txt output file Whisper creates
// Whisper names it <audioFilenameWithoutExt>.txt
// ─────────────────────────────────────────────────────────────────
const readTranscriptFile = (audioPath) => {
  const audioFilename = path.basename(audioPath, path.extname(audioPath));
  const transcriptPath = path.join(TRANSCRIPT_DIR, `${audioFilename}.txt`);

  if (!fs.existsSync(transcriptPath)) {
    throw new Error(`Transcript file not found at: ${transcriptPath}`);
  }

  const text = fs.readFileSync(transcriptPath, 'utf-8').trim();

  // Clean up transcript file (we store the text in MongoDB, no need for the file)
  fs.unlinkSync(transcriptPath);

  return text;
};

// ─────────────────────────────────────────────────────────────────
// Helper: Cleanup audio file from disk
// ─────────────────────────────────────────────────────────────────
const cleanupAudioFile = (audioPath) => {
  try {
    if (fs.existsSync(audioPath)) {
      fs.unlinkSync(audioPath);
      console.log(`[VOICE] Cleaned up audio file: ${audioPath}`);
    }
  } catch (err) {
    console.warn(`[VOICE] Could not delete audio file: ${err.message}`);
  }
};

// ─────────────────────────────────────────────────────────────────
// Service 1: Upload Audio
// Saves file to disk (done by multer middleware already).
// Creates a VoiceLog entry and returns the log ID for later use.
// ─────────────────────────────────────────────────────────────────
export const uploadAudio = async (file, ashaId, patientId) => {
  if (!file) throw new Error('No audio file provided.');

  const voiceLog = await VoiceLog.create({
    ashaId,
    patientId: patientId || null,
    audioUrl: file.path, // local path on server disk
    transcript: null,
  });

  return {
    message: 'Audio uploaded successfully.',
    voiceLogId: voiceLog._id,
    filename: file.filename,
    filePath: file.path,
    size: file.size,
  };
};

// ─────────────────────────────────────────────────────────────────
// Service 2: Transcribe Audio
// Runs local Whisper CLI and returns transcript in the source language.
// Pass `language` to force output language (e.g. 'hi', 'mr', 'bn').
// Defaults to 'hi' (Hindi) if not specified.
// Use /voice/translate if you want English output.
// ─────────────────────────────────────────────────────────────────
export const transcribeAudio = async (file, voiceLogId, ashaId, language = 'hi') => {
  if (!file) throw new Error('No audio file provided.');

  const audioPath = file.path;

  try {
    console.log(`[WHISPER] Transcribing in language: ${language} | File: ${audioPath}`);
    // Pass language explicitly — this guarantees Whisper transcribes
    // in the source language instead of silently translating to English.
    await runWhisper(audioPath, 'transcribe', language);

    const transcript = readTranscriptFile(audioPath);
    console.log(`[WHISPER] Transcript: ${transcript.substring(0, 100)}...`);

    // Save transcript to the VoiceLog if a log ID was passed
    if (voiceLogId) {
      await VoiceLog.findByIdAndUpdate(voiceLogId, { transcript });
    } else {
      // Create a new VoiceLog with the transcript
      await VoiceLog.create({
        ashaId,           // from the logged-in user
        audioUrl: audioPath,
        transcript,
      });
    }

    return { transcript, language };
  } finally {
    // Always clean up audio from disk after processing
    cleanupAudioFile(audioPath);
  }
};

// ─────────────────────────────────────────────────────────────────
// Service 3: Translate Audio → English
// Uses Whisper's built-in --task translate (auto-detects source language)
// No separate translation API needed — works 100% free and offline!
// Supports: Hindi, Marathi, Bengali, Tamil, Telugu, Bhili, etc.
// ─────────────────────────────────────────────────────────────────
export const translateAudio = async (file) => {
  if (!file) throw new Error('No audio file provided.');

  const audioPath = file.path;

  try {
    console.log(`[WHISPER] Translating: ${audioPath}`);
    await runWhisper(audioPath, 'translate');

    const translatedText = readTranscriptFile(audioPath);
    console.log(`[WHISPER] Translation: ${translatedText.substring(0, 100)}...`);

    return {
      translatedText,
      note: 'Translated to English using local Whisper. Source language was auto-detected.',
    };
  } finally {
    cleanupAudioFile(audioPath);
  }
};
