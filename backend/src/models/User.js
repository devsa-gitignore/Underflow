import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
    },
    phoneNumber: {
      type: String,
      required: [true, 'Please provide a phone number'],
      unique: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['asha', 'admin'],
      default: 'asha',
    },
    village: {
      type: String,
      required: [true, 'Please provide a village'],
    },
    otp: {
      type: String,
    },
    otpExpires: {
      type: Date,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Method to verify OTP
userSchema.methods.compareOTP = async function (enteredOtp) {
  // If we hash OTPs, we should use bcrypt. Compare directly if it's plaintext.
  // For safety, hashing is better, but maybe overkill for OTPs that expire in 5 mins.
  return enteredOtp === this.otp;
};

const User = mongoose.model('User', userSchema);
export default User;
