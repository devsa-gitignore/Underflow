import express from 'express';
import {
  createPatient,
  bulkRegister,
  getPatient,
  searchPatients,
  updatePatient,
  deletePatient,
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

export default router;
