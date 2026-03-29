import { RISK_LEVELS } from '../config/constants.js';

export const normalizeRiskLevel = (riskLevel) => {
  const normalized = String(riskLevel || RISK_LEVELS.LOW).toUpperCase().trim();
  if (normalized === 'MODERATE') return RISK_LEVELS.MEDIUM;
  if (Object.values(RISK_LEVELS).includes(normalized)) return normalized;
  return RISK_LEVELS.LOW;
};

export const inferRiskFromVisit = ({ vitals = {}, symptoms = [], otherFactors = '', isPregnant = false }) => {
  const bp = String(vitals.bloodPressure || '').trim();
  const bloodSugar = Number(vitals.bloodSugar || 0);
  const symptomText = Array.isArray(symptoms) ? symptoms.join(' ').toLowerCase() : String(symptoms || '').toLowerCase();
  const factors = String(otherFactors || '').toLowerCase();

  let systolic = 0;
  let diastolic = 0;
  if (bp.includes('/')) {
    [systolic, diastolic] = bp.split('/').map((part) => Number(part) || 0);
  }

  const hasCriticalSymptoms = ['blurred vision', 'bleeding', 'convulsion', 'faint', 'severe headache', 'swelling', 'breathless']
    .some((flag) => symptomText.includes(flag));

  if (systolic >= 160 || diastolic >= 110 || bloodSugar >= 250 || hasCriticalSymptoms) {
    return RISK_LEVELS.CRITICAL;
  }

  if (systolic >= 140 || diastolic >= 90 || bloodSugar >= 200) {
    return RISK_LEVELS.HIGH;
  }

  if (
    systolic >= 130 ||
    diastolic >= 85 ||
    bloodSugar >= 140 ||
    symptomText.split(',').filter(Boolean).length >= 2 ||
    (isPregnant && factors.includes('risk'))
  ) {
    return RISK_LEVELS.MEDIUM;
  }

  return RISK_LEVELS.LOW;
};

export const buildVisitSuggestion = (patientName, riskLevel) => {
  switch (normalizeRiskLevel(riskLevel)) {
    case RISK_LEVELS.CRITICAL:
      return `Urgent referral recommended for ${patientName}. Escalate to PHC immediately.`;
    case RISK_LEVELS.HIGH:
      return `High-risk findings detected for ${patientName}. Follow up within 24-48 hours.`;
    case RISK_LEVELS.MEDIUM:
      return `Monitor ${patientName} closely and schedule the next review soon.`;
    default:
      return `Continue routine monitoring for ${patientName}.`;
  }
};
