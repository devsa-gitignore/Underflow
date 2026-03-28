import express from 'express';
import { decodeQR } from '../controllers/qr.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

// All QR routes are private (ASHA Workers)
router.use(protect);

router.post('/decode', decodeQR);

export default router;
