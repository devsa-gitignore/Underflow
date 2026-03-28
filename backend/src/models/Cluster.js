import mongoose from 'mongoose';
import { SEVERITY } from '../config/constants.js';

const clusterSchema = new mongoose.Schema(
  {
    region: {
      type: String,
      required: true,
    },
    disease: {
      type: String,
      required: true,
    },
    caseCount: {
      type: Number,
      default: 1,
    },
    severity: {
      type: String,
      enum: Object.values(SEVERITY),
      default: SEVERITY.LOW,
    },
    detectedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Cluster = mongoose.model('Cluster', clusterSchema);
export default Cluster;
