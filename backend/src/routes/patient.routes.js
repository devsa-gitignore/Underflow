import express from 'express';
import {
  createPatient,
  bulkRegister,
  getPatient,
  searchPatients,
  updatePatient,
  deletePatient,
  generateQR,
} from '../controllers/patient.controller.js';
import {
  createVisit,
  getVisits,
  getLatestVisit,
  addVitals,
} from '../controllers/visit.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { getPatientComplianceHistory } from '../controllers/compliance.controller.js';

const router = express.Router();

router.use(protect);

router.post('/', createPatient);
router.post('/bulk', bulkRegister);
router.get('/search', searchPatients);
router.get('/:id', getPatient);
router.patch('/:id', updatePatient);
router.delete('/:id', deletePatient);
router.post('/:id/qr', generateQR);


// Visit Routes (Nested)
router.post('/:id/visits', createVisit);
router.get('/:id/visits', getVisits);
router.get('/:id/visits/latest', getLatestVisit);
router.post('/:id/vitals', addVitals);

// Compliance Routes (Nested)
router.get('/:id/compliance', getPatientComplianceHistory);

export default router;
