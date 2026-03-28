import Visit from '../models/Visit.js';
import Patient from '../models/Patient.js';

export const createVisit = async (patientId, ashaId, visitData) => {
  const visit = await Visit.create({
    patientId,
    ashaId,
    ...visitData,
  });

  // Update patient's current risk level to reflect the latest visit
  if (visitData.riskLevel) {
    await Patient.findByIdAndUpdate(patientId, {
      currentRiskLevel: visitData.riskLevel,
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
