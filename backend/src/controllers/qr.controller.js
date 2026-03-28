import asyncHandler from 'express-async-handler';
import Patient from '../models/Patient.js';

// @desc    Decode QR (Lookup patient by scanned payload)
// @route   POST /qr/decode
// @access  Private
export const decodeQR = asyncHandler(async (req, res) => {
  const { scannedData } = req.body;

  if (!scannedData) {
    res.status(400);
    throw new Error('Please provide scanned QR data');
  }

  try {
    // Attempt to parse at scanned data as JSON (profile-encoded)
    const profile = JSON.parse(scannedData);
    if (profile && profile._id) {
      return res.status(200).json({
        success: true,
        patient: profile,
        decodingSource: 'QR Payload',
      });
    }
  } catch (err) {
    // Fallback if the QR only contains an ID
  }

  // Assuming the scanned data is the patient ID if JSON fails
  const patient = await Patient.findOne({ _id: scannedData, isDeleted: false });

  if (!patient) {
    res.status(404);
    throw new Error('Patient not found for the provided QR code');
  }

  res.status(200).json({
    success: true,
    patient,
  });
});
