import mongoose from 'mongoose';
import { RISK_LEVELS } from '../config/constants.js';

const visitSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    ashaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    symptoms: [
      {
        type: String,
      },
    ],
    notes: {
      type: String,
    },
    vitals: {
      temperature: { type: Number },
      bloodPressure: { type: String },
      weight: { type: Number },
    },
    riskLevel: {
      type: String,
      enum: Object.values(RISK_LEVELS),
      default: RISK_LEVELS.LOW,
    },
    aiSuggestion: {
      type: String,
    },
    visitDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Visit = mongoose.model('Visit', visitSchema);
export default Visit;
