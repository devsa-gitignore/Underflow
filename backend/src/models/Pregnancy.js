import mongoose from 'mongoose';
import { RISK_LEVELS } from '../config/constants.js';

const pregnancySchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    currentWeek: {
      type: Number,
      default: 1,
    },
    riskLevel: {
      type: String,
      enum: [RISK_LEVELS.LOW, RISK_LEVELS.HIGH],
      default: RISK_LEVELS.LOW,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Pregnancy = mongoose.model('Pregnancy', pregnancySchema);
export default Pregnancy;
