import mongoose from 'mongoose';
import { STATUS, COMPLIANCE_TYPES } from '../config/constants.js';

const complianceSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    ashaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    type: {
      type: String,
      enum: Object.values(COMPLIANCE_TYPES),
      required: true,
    },
    status: {
      type: String,
      enum: [STATUS.COMPLETED, STATUS.MISSED, STATUS.PENDING],
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Compliance = mongoose.model('Compliance', complianceSchema);
export default Compliance;
