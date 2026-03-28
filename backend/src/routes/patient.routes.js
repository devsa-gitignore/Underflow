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
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.post('/', createPatient);
router.post('/bulk', bulkRegister);
router.get('/search', searchPatients);
router.get('/:id', getPatient);
router.patch('/:id', updatePatient);
router.delete('/:id', deletePatient);
router.post('/:id/qr', generateQR);

export default router;
