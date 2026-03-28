import express from 'express';
import { logCompliance, getMissedActions } from '../controllers/compliance.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect);

// Because the `GET /patients/:id/compliance` conceptually lives under `/patients`,
// we will handle it in the `patient.routes.js` or attach it directly to this router if preferred.
// But based on the user's route structure:
// POST /compliance
// GET /compliance/missed
// GET /patients/:id/compliance

// 1. Log Compliance
router.post('/', logCompliance);

// 2. Detect Missed Actions
router.get('/missed', getMissedActions);

export default router;
