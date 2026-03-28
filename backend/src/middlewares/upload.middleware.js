import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Ensure upload dirs exist ───────────────────────────────
const AUDIO_DIR = path.join(__dirname, '../../uploads/audio');
const TRANSCRIPT_DIR = path.join(__dirname, '../../uploads/transcripts');

if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR, { recursive: true });
if (!fs.existsSync(TRANSCRIPT_DIR)) fs.mkdirSync(TRANSCRIPT_DIR, { recursive: true });

// ─── Multer disk storage ────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, AUDIO_DIR);
  },
  filename: (req, file, cb) => {
    // voice_<timestamp>.<ext>
    const ext = path.extname(file.originalname) || '.webm';
    cb(null, `voice_${Date.now()}${ext}`);
  },
});

// ─── Allowed audio MIME types ───────────────────────────────
const ALLOWED_AUDIO_TYPES = [
  'audio/mpeg',
  'audio/mp4',
  'audio/wav',
  'audio/webm',
  'audio/ogg',
  'audio/x-m4a',
  'audio/flac',
  'audio/mp3',
  'video/webm', // some browsers send webm recordings as video/webm
];

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB (local Whisper handles any size)

const fileFilter = (req, file, cb) => {
  if (ALLOWED_AUDIO_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type: "${file.mimetype}". Only audio files are allowed.`
      ),
      false
    );
  }
};

export const uploadAudio = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
}).single('audio');

export { AUDIO_DIR, TRANSCRIPT_DIR };
