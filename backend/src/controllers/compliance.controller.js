import asyncHandler from 'express-async-handler';
import * as complianceService from '../services/compliance.service.js';

// @desc    Log a new compliance entry (Completed or Missed)
// @route   POST /compliance
// @access  Private (ASHA Worker usually)
export const logCompliance = asyncHandler(async (req, res) => {
  const { patientId, type, status, date, notes } = req.body;
  
  if (!patientId || !type || !status) {
    res.status(400);
    throw new Error('Please provide patientId, type, and status');
  }

  // Use the authenticated user's ID and Role
  const ashaId = req.user ? req.user._id : req.body.ashaId;
  const role = req.user ? req.user.role : 'ASHA';

  const compliance = await complianceService.logCompliance({
    patientId,
    ashaId,
    type,
    status,
    notes,
    date
  }, role);

  res.status(201).json({ success: true, compliance });
});

// @desc    Get all compliance history for a specific patient
// @route   GET /patients/:id/compliance
// @access  Private
export const getPatientComplianceHistory = asyncHandler(async (req, res) => {
  const patientId = req.params.id;
  
  const history = await complianceService.getPatientComplianceHistory(patientId);

  res.status(200).json({ success: true, count: history.length, history });
});

// @desc    Get all missed compliance actions
// @route   GET /compliance/missed
// @access  Private
export const getMissedActions = asyncHandler(async (req, res) => {
  // Aggressively isolate DB responses directly using the secure JWT Token ID
  const ashaId = req.user ? req.user._id : null;

  const missedActions = await complianceService.detectMissedActions(ashaId);
  res.status(200).json({ success: true, count: missedActions.length, missedActions });
});

// @desc    Patch an existing Missed Task to Completed
// @route   PATCH /compliance/:id/resolve
// @access  Private
export const resolveMissedTask = asyncHandler(async (req, res) => {
  const taskId = req.params.id;
  
  const compliance = await complianceService.resolveMissedTask(taskId);
  res.status(200).json({ success: true, compliance });
});

// @desc    Delete a compliance log from history or dashboard
// @route   DELETE /compliance/:id
// @access  Private
export const deleteComplianceRecord = asyncHandler(async (req, res) => {
  const taskId = req.params.id;
  await complianceService.deleteComplianceRecord(taskId);
  res.status(200).json({ success: true, message: 'Compliance record officially deleted' });
});

// @desc    Edit the notes on an existing compliance record
// @route   PATCH /compliance/:id/notes
// @access  Private
export const updateComplianceNote = asyncHandler(async (req, res) => {
  const taskId = req.params.id;
  const { notes } = req.body;
  
  const compliance = await complianceService.updateComplianceNote(taskId, notes);
  res.status(200).json({ success: true, compliance });
});
