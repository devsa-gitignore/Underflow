import express from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import { 
  getDashboardStats, 
  getWardStats, 
  getTrendStats, 
  getSyncLogs 
} from '../controllers/admin.controller.js';

const router = express.Router();

router.get('/stats', getDashboardStats);
router.get('/ward-stats', getWardStats);
router.get('/trend-stats', getTrendStats);
router.get('/sync-logs', getSyncLogs);

export default router;
