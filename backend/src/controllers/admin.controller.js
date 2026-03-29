import Patient from '../models/Patient.js';
import Alert from '../models/Alert.js';
import User from '../models/User.js';
import { STATUS, RISK_LEVELS } from '../config/constants.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    const totalPatients = await Patient.countDocuments();
    const maternalCount = await Patient.countDocuments({ isPregnant: true });
    
    // Count active alerts (Critical/High usually mean action needed)
    const activeAlerts = await Alert.countDocuments({ status: STATUS.ACTIVE });
    
    // Count workers
    const activeWorkers = await User.countDocuments({ role: 'asha' });
    
    return res.status(200).json({
      success: true,
      data: {
        totalPatients,
        maternalCount,
        activeAlerts,
        activeWorkers,
        syncedLast24h: activeWorkers // mocking sync count for now until we track sync logs
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getWardStats = async (req, res, next) => {
  try {
    const wardStats = await Patient.aggregate([
      {
        $group: {
          _id: '$village', // Treating village as the Ward/Region
          totalCases: { $sum: 1 },
          criticalCases: { 
            $sum: { $cond: [{ $eq: ['$currentRiskLevel', RISK_LEVELS.HIGH] }, 1, 0] } 
          },
          maternalCases: {
            $sum: { $cond: [{ $eq: ['$isPregnant', true] }, 1, 0] }
          },
          workers: { $addToSet: '$ashaId' }
        }
      },
      {
        $project: {
          location: '$_id',
          totalCases: 1,
          criticalCases: 1,
          maternalCases: 1,
          workerCount: { $size: '$workers' },
          _id: 0
        }
      },
      { $sort: { location: 1 } }
    ]);

    return res.status(200).json({
      success: true,
      data: wardStats
    });
  } catch (error) {
    next(error);
  }
};

export const getTrendStats = async (req, res, next) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const trend = await Patient.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          cases: { $sum: 1 }
        }
      }
    ]);

    // Ensure all 7 days are represented, even if 0 cases.
    const last7Days = [];
    const today = new Date();
    for(let i=6; i>=0; i--) {
       const d = new Date(today);
       d.setDate(d.getDate() - i);
       // YYYY-MM-DD local logic safely
       const dateStr = d.toLocaleDateString('en-CA'); 
       
       const found = trend.find(t => t._id === dateStr);
       last7Days.push({
         date: dateStr,
         cases: found ? found.cases : 0,
         dayName: i === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' })
       });
    }

    return res.status(200).json({
      success: true,
      data: last7Days
    });
  } catch (error) {
    next(error);
  }
};
