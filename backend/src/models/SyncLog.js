import mongoose from 'mongoose';

const syncLogSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      default: 'WEB_CLIENT_DEMO',
    },
    ashaId: {
      type: String, // String to be safe with mock IDs like 'AW-1029'
      required: true,
    },
    actionsProcessed: {
      type: Number,
      default: 0,
    },
    actionTypes: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'PARTIAL', 'FAILED'],
      default: 'SUCCESS',
    },
    details: [
      {
        actionType: { type: String },
        data: mongoose.Schema.Types.Mixed,
        success: Boolean,
        error: String
      }
    ],
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
