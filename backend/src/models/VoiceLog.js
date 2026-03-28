import mongoose from 'mongoose';

const voiceLogSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
    },
    ashaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    audioUrl: {
      type: String,
      required: true,
    },
    transcript: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const VoiceLog = mongoose.model('VoiceLog', voiceLogSchema);
export default VoiceLog;
