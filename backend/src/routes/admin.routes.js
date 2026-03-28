import express from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import { getAreaSeverityHeatmap } from '../controllers/admin.controller.js';

const router = express.Router();

router.use(protect);

router.get('/heatmap', getAreaSeverityHeatmap);

export default router;
