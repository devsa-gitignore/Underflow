import mongoose from 'mongoose';
import { STATUS } from '../config/constants.js';

const complianceSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    type: {
      type: String,
      enum: ['VACCINATION', 'CHECKUP'],
      required: true,
    },
    status: {
      type: String,
      enum: [STATUS.COMPLETED, STATUS.MISSED],
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
