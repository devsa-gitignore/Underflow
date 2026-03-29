import express from 'express';
import { logCompliance, getMissedActions, resolveMissedTask, deleteComplianceRecord } from '../controllers/compliance.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect);

// 1. Log Compliance
router.post('/', logCompliance);

// 2. Detect Missed Actions
router.get('/missed', getMissedActions);

// 3. Resolve Missed Action
router.patch('/:id/resolve', resolveMissedTask);

// 4. Delete Compliance Record
router.delete('/:id', deleteComplianceRecord);

export default router;
