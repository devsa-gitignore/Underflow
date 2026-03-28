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
    phone: {
      type: String,
      trim: true,
      // No unique constraint to allow multiple people with same phone (family/neighbour)
    },
    village: {
      type: String,
      required: [true, 'Village is required'],
    },
    region: {
      type: String,
    },
    ashaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Assigned ASHA worker/User is required'],
    },
    qrCode: {
      type: String, // URL or base64
    },
    isPregnant: {
      type: Boolean,
      default: false,
    },
    pregnancyStartDate: {
      type: Date,
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
patientSchema.pre('find', function () {
  this.where({ isDeleted: false });
});

patientSchema.pre('findOne', function () {
  this.where({ isDeleted: false });
});

const Patient = mongoose.model('Patient', patientSchema);
export default Patient;
