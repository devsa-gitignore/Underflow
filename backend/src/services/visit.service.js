import mongoose from 'mongoose';
import Visit from '../models/Visit.js';
import Patient from '../models/Patient.js';
import Alert from '../models/Alert.js';
import { SEVERITY } from '../config/constants.js';
import { buildVisitSuggestion, inferRiskFromVisit, normalizeRiskLevel } from '../utils/risk.js';

export const createVisit = async (patientId, ashaId, visitData) => {
  let patient = null;
  // Gracefully handle mock or temp IDs during offline-first sync
  if (mongoose.Types.ObjectId.isValid(patientId)) {
    patient = await Patient.findById(patientId);
  } else {
    console.warn(`[Sync Warning] createVisit received non-standard patientId: ${patientId}. Bypassing strict Patient bind.`);
  }

  const normalizedRisk = normalizeRiskLevel(
    visitData.riskLevel || inferRiskFromVisit({ ...visitData, isPregnant: patient?.isPregnant })
  );

  // If patientId isn't a valid ObjectId, we skip actual Visit creation to avoid DB CastErrors 
  // since the Visit schema strictly requires an ObjectId for patientId.
  if (!patient) {
     console.warn(`[Sync Skips] Visit for phantom patient ${patientId} skipped.`);
     return { simulated: true, status: 'skipped', tempId: patientId };
  }

  const visit = await Visit.create({
    patientId,
    ashaId,
    ...visitData,
    riskLevel: normalizedRisk,
    aiSuggestion: visitData.aiSuggestion || buildVisitSuggestion(patient?.name || 'the patient', normalizedRisk),
  });

  patient.currentRiskLevel = normalizedRisk;
  patient.pendingTask = 'Completed Today';
  patient.lastVisitedAt = visit.visitDate;
  await patient.save();

  const bp = visitData.vitals?.bloodPressure;
  if (bp) {
    const parts = bp.split('/').map(Number);
    if (parts.length === 2 && (parts[0] >= 140 || parts[1] >= 90)) {
      await Alert.create({
        patientId,
        ashaId,
        type: 'HIGH_BP_ALERT',
        message: `High blood pressure detected (${bp}) for ${patient.name}. Immediate monitoring recommended.`,
        severity: parts[0] >= 160 ? SEVERITY.HIGH : SEVERITY.MEDIUM,
      });
    }
  }

  if (normalizedRisk === 'CRITICAL' || normalizedRisk === 'HIGH') {
    await Alert.create({
      patientId,
      ashaId,
      type: 'HIGH_RISK_VISIT',
      message: `${normalizedRisk} risk visit recorded for ${patient.name}. Symptoms: ${(visitData.symptoms || []).join(', ') || 'None reported'}.`,
      severity: normalizedRisk === 'CRITICAL' ? SEVERITY.HIGH : SEVERITY.MEDIUM,
    });
  }

  return visit;
};

export const getVisitsByPatient = async (patientId) => {
  return Visit.find({ patientId }).sort({ visitDate: -1 });
};

export const getLatestVisit = async (patientId) => {
  return Visit.findOne({ patientId }).sort({ visitDate: -1 });
};

export const addVitalsToVisit = async (patientId, vitals) => {
  const latestVisit = await Visit.findOne({
    patientId,
    visitDate: {
      $gte: new Date(new Date().setHours(0, 0, 0, 0)),
    },
  }).sort({ visitDate: -1 });

  if (!latestVisit) {
    throw new Error('No visit found for today to add vitals to. Start a visit first.');
  }

  latestVisit.vitals = { ...latestVisit.vitals, ...vitals };
  latestVisit.riskLevel = normalizeRiskLevel(
    inferRiskFromVisit({
      vitals: latestVisit.vitals,
      symptoms: latestVisit.symptoms,
      otherFactors: latestVisit.otherFactors,
    })
  );
  await latestVisit.save();
  return latestVisit;
};
