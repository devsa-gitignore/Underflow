import asyncHandler from 'express-async-handler';
import { evaluateRisk, generateTimeline, detectEpidemic } from '../services/ai.service.js';
import * as alertService from '../services/alert.service.js';
import Patient from '../models/Patient.js';
import { SEVERITY } from '../config/constants.js';
import { normalizeRiskLevel } from '../utils/risk.js';

export const analyzeRisk = asyncHandler(async (req, res) => {
  const { bp, weight, bloodSugar, symptoms, otherFactors, patientId } = req.body;

  const aiResult = await evaluateRisk({ bp, weight, bloodSugar, symptoms, otherFactors });
  const risk = normalizeRiskLevel(aiResult.riskLevel);
  aiResult.riskLevel = risk;

  let updatedPatientMsg = null;
  let alertCreatedMsg = null;
  const isHigh = risk === 'HIGH' || risk === 'CRITICAL';
  const isModerate = risk === 'MEDIUM';

  if (patientId) {
    try {
      const patient = await Patient.findById(patientId);
      if (patient) {
        patient.currentRiskLevel = risk;
        await patient.save();
        updatedPatientMsg = `Patient ${patient.name}'s risk level updated to ${patient.currentRiskLevel}.`;
      }
    } catch (error) {
      console.error(`[DEBUG] Error updating patient risk: ${error.message}`);
    }
  }

  if (isHigh || isModerate) {
    try {
      const alertData = {
        ashaId: req.user?._id,
        type: isHigh ? 'HIGH_RISK_ALERT' : 'MODERATE_RISK_ALERT',
        message: `AI ALERT: ${risk} detected! Condition: ${aiResult.possibleCondition}. Advice: ${aiResult.adviceForAshaWorker}`,
        severity: isHigh ? SEVERITY.HIGH : SEVERITY.MEDIUM,
      };

      if (patientId) alertData.patientId = patientId;

      const newAlert = await alertService.createAlert(alertData);
      alertCreatedMsg = `Successfully saved ${alertData.type} (ID: ${newAlert._id})`;
    } catch (alertError) {
      alertCreatedMsg = `Alert creation failed: ${alertError.message}`;
    }
  }

  if (!alertCreatedMsg) {
    alertCreatedMsg = `No alert triggered (Risk: ${risk})`;
  }

  res.status(200).json({
    success: true,
    data: aiResult,
    message: updatedPatientMsg,
    alert: alertCreatedMsg,
  });
});

export const getTimeline = asyncHandler(async (req, res) => {
  const { age, lmp, conditions, currentMonth } = req.body;

  if (!age && !currentMonth) {
    res.status(400);
    throw new Error('Please provide at least age and currentMonth for a timeline.');
  }

  const timelineData = await generateTimeline({ age, lmp, conditions, currentMonth });

  res.status(200).json({
    success: true,
    data: timelineData,
  });
});

export const getEpidemicAlerts = asyncHandler(async (req, res) => {
  const { aggregatedDataText } = req.body;

  if (!aggregatedDataText) {
    res.status(400);
    throw new Error("Please provide 'aggregatedDataText' representing recent health checkups.");
  }

  const alertResult = await detectEpidemic(aggregatedDataText);
  let dbAlertMsg = null;
  const level = String(alertResult.alertLevel || 'NORMAL').toUpperCase();

  if (level === 'WARNING' || level === 'CRITICAL') {
    const alert = await alertService.createAlert({
      ashaId: req.user?._id,
      type: 'EPIDEMIC_OUTBREAK',
      message: `REGIONAL ${level}: ${alertResult.findings}. Advice: ${alertResult.recommendations}`,
      severity: level === 'CRITICAL' ? SEVERITY.HIGH : SEVERITY.MEDIUM,
    });
    dbAlertMsg = `Regional epidemic alert ${alert._id} saved to database.`;
  }

  res.status(200).json({
    success: true,
    data: alertResult,
    message: dbAlertMsg,
  });
});
