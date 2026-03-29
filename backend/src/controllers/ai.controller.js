import asyncHandler from 'express-async-handler';
import { evaluateRisk, generateTimeline, detectEpidemic } from '../services/ai.service.js';
import * as alertService from '../services/alert.service.js';
import Patient from '../models/Patient.js';
import { SEVERITY } from '../config/constants.js';
import { normalizeRiskLevel } from '../utils/risk.js';

const mapAiServiceError = (error) => {
  const rawMessage = String(error?.message || error || 'Unknown AI service error');
  const message = rawMessage.toLowerCase();

  if (message.includes('timed out')) {
    return {
      status: 504,
      message: 'AI service timed out. Please retry shortly.',
      code: 'AI_TIMEOUT',
      details: rawMessage,
    };
  }

  if (message.includes('quota') || message.includes('429 too many requests') || message.includes('rate limit')) {
    return {
      status: 503,
      message: 'AI provider limit reached. Please retry later.',
      code: 'AI_RATE_LIMIT',
      details: rawMessage,
    };
  }

  if (
    message.includes('failed to parse') ||
    message.includes('missing required fields') ||
    message.includes('must be a non-empty array')
  ) {
    return {
      status: 502,
      message: 'AI provider returned an invalid response format.',
      code: 'AI_INVALID_RESPONSE',
      details: rawMessage,
    };
  }

  if (
    message.includes('not configured in the environment variables') ||
    message.includes('empty response')
  ) {
    return {
      status: 500,
      message: 'AI provider is not configured correctly.',
      code: 'AI_MISCONFIGURED',
      details: rawMessage,
    };
  }

  return {
    status: 502,
    message: 'AI service request failed.',
    code: 'AI_SERVICE_ERROR',
    details: rawMessage,
  };
};

export const analyzeRisk = asyncHandler(async (req, res) => {
  const { bp, weight, bloodSugar, symptoms, otherFactors, patientId } = req.body;

  let aiResult;
  try {
    aiResult = await evaluateRisk({ bp, weight, bloodSugar, symptoms, otherFactors });
  } catch (error) {
    const mapped = mapAiServiceError(error);
    res.status(mapped.status);
    throw new Error(`${mapped.message} [${mapped.code}] ${mapped.details}`);
  }

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

  let timelineData;
  try {
    timelineData = await generateTimeline({ age, lmp, conditions, currentMonth });
  } catch (error) {
    const mapped = mapAiServiceError(error);
    res.status(mapped.status);
    throw new Error(`${mapped.message} [${mapped.code}] ${mapped.details}`);
  }

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

  let alertResult;
  try {
    alertResult = await detectEpidemic(aggregatedDataText);
  } catch (error) {
    const mapped = mapAiServiceError(error);
    res.status(mapped.status);
    throw new Error(`${mapped.message} [${mapped.code}] ${mapped.details}`);
  }

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
