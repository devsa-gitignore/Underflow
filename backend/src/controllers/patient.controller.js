import asyncHandler from 'express-async-handler';
import * as patientService from '../services/patient.service.js';

// @desc    Create a new patient
// @route   POST /patients
// @access  Private (ASHA Only)
export const createPatient = asyncHandler(async (req, res) => {
  const patient = await patientService.createPatient(req.body, req.user._id);
  res.status(201).json(patient);
});

// @desc    Bulk register patients
// @route   POST /patients/bulk
// @access  Private (ASHA Only)
export const bulkRegister = asyncHandler(async (req, res) => {
  const { patients } = req.body;
  if (!patients || !Array.isArray(patients)) {
    res.status(400);
    throw new Error('Please provide an array of patients');
  }

  const result = await patientService.bulkCreatePatients(patients, req.user._id);
  res.status(201).json({
    success: true,
    count: result.length,
    data: result,
  });
});

// @desc    Search patients
// @route   GET /patients/search
// @access  Private
export const searchPatients = asyncHandler(async (req, res) => {
  const { q, village, region } = req.query;
  // Ensure we selectively pass the logged in ASHA worker's ID to filter their specific assigned patients
  const ashaId = req.user && req.user.role === 'ASHA' ? req.user._id : null;
  const patients = await patientService.searchPatients(q, village, region, ashaId);
  res.status(200).json(patients);
});

// @desc    Get patient by ID
// @route   GET /patients/:id
// @access  Private
export const getPatient = asyncHandler(async (req, res) => {
  const patient = await patientService.getPatientById(req.params.id);
  res.status(200).json(patient);
});

// @desc    Update patient
// @route   PATCH /patients/:id
// @access  Private
export const updatePatient = asyncHandler(async (req, res) => {
  const patient = await patientService.updatePatient(req.params.id, req.body);
  res.status(200).json(patient);
});

// @desc    Delete patient (soft delete)
// @route   DELETE /patients/:id
// @access  Private
export const deletePatient = asyncHandler(async (req, res) => {
  const result = await patientService.softDeletePatient(req.params.id);
  res.status(200).json(result);
});

// @desc    Generate QR code for a patient
// @route   POST /patients/:id/qr
// @access  Private
export const generateQR = asyncHandler(async (req, res) => {
  const patient = await patientService.generatePatientQR(req.params.id);
  res.status(200).json({
    success: true,
    qrCode: patient.qrCode,
    message: 'QR code generated and saved successfully',
  });
});
