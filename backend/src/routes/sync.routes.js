import express from 'express';
import * as syncController from '../controllers/sync.controller.js';

const router = express.Router();

// Publicly accessible for now (hackathon-friendly)
// Ideally these would be protected with an ASHA worker's JWT
router.post('/upload', syncController.uploadSync);
router.get('/download', syncController.downloadSync);

export default router;
