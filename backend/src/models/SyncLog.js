import mongoose from 'mongoose';

const syncLogSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: true,
    },
    ashaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    actionsProcessed: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'PARTIAL', 'FAILED'],
      default: 'SUCCESS',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const SyncLog = mongoose.model('SyncLog', syncLogSchema);
export default SyncLog;
