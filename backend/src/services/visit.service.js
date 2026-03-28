import Visit from '../models/Visit.js';
import Patient from '../models/Patient.js';
import Alert from '../models/Alert.js';
import { SEVERITY } from '../config/constants.js';

export const createVisit = async (patientId, ashaId, visitData) => {
  const visit = await Visit.create({
    patientId,
    ashaId,
    ...visitData,
  });

  const patient = await Patient.findById(patientId);
  if (!patient) return visit;

  // 1. Update patient risk level from visit
  if (visitData.riskLevel) {
    patient.currentRiskLevel = visitData.riskLevel;
  }

  // 2. DYNAMIC TASK MANAGEMENT — auto-assign pendingTask based on patient state
  const risk = (visitData.riskLevel || patient.currentRiskLevel || 'LOW').toUpperCase();
  if (risk === 'CRITICAL' || risk === 'HIGH') {
    patient.pendingTask = 'High Risk monitoring';
  } else if (patient.isPregnant) {
    patient.pendingTask = 'Maternal Follow-up';
  } else if (patient.age < 15) {
    patient.pendingTask = 'Vaccination';
  } else if (risk === 'MEDIUM') {
    patient.pendingTask = 'Follow-up Required';
  } else {
    patient.pendingTask = 'Routine Checkup';
  }
  await patient.save();

  // 3. AUTOMATED ALERTING — auto-create alert for dangerous vitals
  const bp = visitData.vitals?.bloodPressure;
  if (bp) {
    const parts = bp.split('/').map(Number);
    if (parts.length === 2 && (parts[0] >= 140 || parts[1] >= 90)) {
      await Alert.create({
        patientId,
        ashaId,
        type: 'HIGH_BP_ALERT',
        message: `⚠️ High blood pressure detected (${bp}) for ${patient.name}. Immediate monitoring recommended. ${parts[0] >= 160 ? 'CRITICAL: Refer to PHC immediately.' : 'Schedule follow-up within 48 hours.'}`,
        severity: parts[0] >= 160 ? SEVERITY.HIGH : SEVERITY.MEDIUM,
      });
    }
  }

  // Auto-alert for high risk visits
  if (risk === 'CRITICAL' || risk === 'HIGH') {
    await Alert.create({
      patientId,
      ashaId,
      type: 'HIGH_RISK_VISIT',
      message: `⚠️ ${risk} risk visit recorded for ${patient.name}. Symptoms: ${(visitData.symptoms || []).join(', ') || 'None reported'}. Immediate follow-up required.`,
      severity: risk === 'CRITICAL' ? SEVERITY.HIGH : SEVERITY.MEDIUM,
    });
  }

  return visit;
};


export const getVisitsByPatient = async (patientId) => {
  const visits = await Visit.find({ patientId }).sort({ visitDate: -1 });
  return visits;
};

export const getLatestVisit = async (patientId) => {
  const visit = await Visit.findOne({ patientId }).sort({ visitDate: -1 });
  return visit;
};

export const addVitalsToVisit = async (patientId, vitals) => {
  // Find latest visit to add vitals to?
  // Or create a new visit with just vitals?
  // Typically "Add Vitals" might mean updating the latest visit today.
  
  const latestVisit = await Visit.findOne({ 
    patientId, 
    visitDate: { 
      $gte: new Date(new Date().setHours(0, 0, 0, 0)) 
    } 
  }).sort({ visitDate: -1 });

  if (latestVisit) {
    latestVisit.vitals = { ...latestVisit.vitals, ...vitals };
    await latestVisit.save();
    return latestVisit;
  } else {
    // If no visit today, maybe create one with just vitals (as specified by user's endpoint design)
    // Actually, user design has a specific endpoint for it.
    throw new Error('No visit found for today to add vitals to. Start a visit first.');
  }
};
