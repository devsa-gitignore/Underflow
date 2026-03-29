import express from 'express';
import { logCompliance, getMissedActions, resolveMissedTask } from '../controllers/compliance.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect);

// 1. Log Compliance
router.post('/', logCompliance);

// 2. Detect Missed Actions
router.get('/missed', getMissedActions);

// 3. Resolve Missed Action
router.patch('/:id/resolve', resolveMissedTask);

export default router;
