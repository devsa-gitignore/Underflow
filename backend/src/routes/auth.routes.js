import express from 'express';
import {
  sendOTP,
  login,
  getMe,
} from '../controllers/auth.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/send-otp', sendOTP);
router.post('/login', login);
router.get('/me', protect, getMe);

export default router;
