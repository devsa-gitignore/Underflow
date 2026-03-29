import express from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import { getDashboardStats, getWardStats, getTrendStats } from '../controllers/admin.controller.js';

const router = express.Router();

// Apply auth middleware if you want to protect this route
// Currently optional for hackathon ease:
// router.use(protect); 
// router.use(authorize('admin', 'doctor')); 

router.get('/stats', getDashboardStats);
router.get('/ward-stats', getWardStats);
router.get('/trend-stats', getTrendStats);

export default router;
