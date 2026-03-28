import express from 'express';
import { getAlerts, updateStatus, escalate, assign } from '../controllers/alert.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect); // All alert routes are protected

router.get('/', getAlerts);
router.patch('/:id', updateStatus);
router.post('/:id/escalate', escalate);
router.post('/:id/assign', assign);

export default router;
