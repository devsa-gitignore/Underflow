import mongoose from 'mongoose';
import { STATUS } from '../config/constants.js';

const followUpSchema = new mongoose.Schema(
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
    type: {
      type: String,
      enum: ['VACCINATION', 'CHECKUP', 'MEDICATION'],
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: [STATUS.PENDING, STATUS.COMPLETED, STATUS.MISSED],
      default: STATUS.PENDING,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const FollowUp = mongoose.model('FollowUp', followUpSchema);
export default FollowUp;
