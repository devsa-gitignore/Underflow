import express from 'express';
import {
  createPatient,
  bulkRegister,
  getPatient,
  searchPatients,
  updatePatient,
  deletePatient,
} from '../controllers/patient.controller.js';
import {
  createVisit,
  getVisits,
  getLatestVisit,
  addVitals,
} from '../controllers/visit.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.post('/', createPatient);
router.post('/bulk', bulkRegister);
router.get('/search', searchPatients);
router.get('/:id', getPatient);
router.patch('/:id', updatePatient);
router.delete('/:id', deletePatient);

// Visit Routes (Nested)
router.post('/:id/visits', createVisit);
router.get('/:id/visits', getVisits);
router.get('/:id/visits/latest', getLatestVisit);
router.post('/:id/vitals', addVitals);

export default router;
