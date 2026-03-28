import express from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import { uploadAudio as multerUpload } from '../middlewares/upload.middleware.js';
import {
  uploadAudio,
  transcribeAudio,
  translateAudio,
} from '../controllers/voice.controller.js';

const router = express.Router();

// All voice routes require authentication
router.use(protect);

// multerUpload runs BEFORE the controller — it parses the multipart form-data
// and attaches the file to req.file
router.post('/upload', multerUpload, uploadAudio);
router.post('/transcribe', multerUpload, transcribeAudio);
router.post('/translate', multerUpload, translateAudio);

export default router;
