import express from 'express';
import { analyzeRisk, getTimeline, getEpidemicAlerts } from '../controllers/ai.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.post('/risk-assessment', analyzeRisk);
router.post('/timeline', getTimeline);
router.post('/epidemic-alerts', getEpidemicAlerts);

export default router;
