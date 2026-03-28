import asyncHandler from 'express-async-handler';
import * as alertService from '../services/alert.service.js';

// @desc    Get all alerts (can filter by status/severity/ashaId)
// @route   GET /alerts
// @access  Private
export const getAlerts = asyncHandler(async (req, res) => {
  const { status, severity, ashaId } = req.query;
  const filters = {};
  if (status) filters.status = status;
  if (severity) filters.severity = severity;
  if (ashaId) filters.ashaId = ashaId;

  // By default, if user is an ASHA worker, they only see their own alerts
  if (req.user.role === 'ASHA') {
    filters.ashaId = req.user._id;
  }

  const alerts = await alertService.getAlerts(filters);
  res.status(200).json({
    success: true,
    alerts
  });
});

// @desc    Update alert status
// @route   PATCH /alerts/:id
// @access  Private
export const updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!status) {
      res.status(400);
      throw new Error("Status is required");
  }
  const alert = await alertService.updateAlertStatus(req.params.id, status);
  if (!alert) {
      res.status(404);
      throw new Error("Alert not found");
  }
  res.status(200).json({
    success: true,
    alert
  });
});

// @desc    Escalate alert (sets status to ESCALATED and severity to HIGH)
// @route   POST /alerts/:id/escalate
// @access  Private
export const escalate = asyncHandler(async (req, res) => {
  const alert = await alertService.escalateAlert(req.params.id);
  if (!alert) {
      res.status(404);
      throw new Error("Alert not found");
  }
  res.status(200).json({
    success: true,
    alert
  });
});

// @desc    Assign alert to a different ASHA
// @route   POST /alerts/:id/assign
// @access  Private (Admin Only)
export const assign = asyncHandler(async (req, res) => {
  const { ashaId } = req.body;
  if (!ashaId) {
      res.status(400);
      throw new Error("ASHA ID is required");
  }
  const alert = await alertService.assignAlert(req.params.id, ashaId);
  if (!alert) {
      res.status(404);
      throw new Error("Alert not found");
  }
  res.status(200).json({
    success: true,
    alert
  });
});
