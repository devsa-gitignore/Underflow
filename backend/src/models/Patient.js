import mongoose from 'mongoose';
import { RISK_LEVELS, GENDER } from '../config/constants.js';

const patientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Patient name is required'],
    },
    age: {
      type: Number,
      required: [true, 'Patient age is required'],
    },
    gender: {
      type: String,
      enum: Object.values(GENDER),
      required: [true, 'Patient gender is required'],
    },
    phoneNumber: {
      type: String,
      trim: true,
      // No unique constraint to allow multiple people with same phone (family/neighbour)
    },
    village: {
      type: String,
      required: [true, 'Village is required'],
    },
    ashaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Assigned ASHA worker/User is required'],
    },
    currentRiskLevel: {
      type: String,
      enum: Object.values(RISK_LEVELS),
      default: RISK_LEVELS.LOW,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Filter out deleted patients in search unless specified
patientSchema.pre(/^find/, function (next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

const Patient = mongoose.model('Patient', patientSchema);
export default Patient;
