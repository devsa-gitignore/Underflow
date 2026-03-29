import Compliance from '../models/Compliance.js';
import Patient from '../models/Patient.js';

/**
 * Log a new compliance record (e.g. VACCINATION COMPLETED, CHECKUP MISSED)
 */
export const logCompliance = async (data, userRole = 'ASHA') => {
  const { patientId, ashaId, type, status, date } = data;

  const patient = await Patient.findById(patientId);
  if (!patient) throw new Error('Patient not found');

  // Authorization Check: ASHA workers can only log for their assigned patients
  if (userRole === 'ASHA' && ashaId && patient.ashaId && patient.ashaId.toString() !== ashaId.toString()) {
    throw new Error('Not authorized: You can only log compliance for your assigned patients.');
  }

  const compliance = await Compliance.create({
    patientId,
    ashaId,
    type,
    status,
    date: date || Date.now()
  });

  return compliance;
};

/**
 * Fetch a patient's entire compliance history
 */
export const getPatientComplianceHistory = async (patientId) => {
  const patient = await Patient.findById(patientId);
  if (!patient) throw new Error('Patient not found');

  const history = await Compliance.find({ patientId })
    .populate('patientId', 'name phone age village region')
    .sort({ date: -1 });
  return history;
};

/**
 * Detect globally missed or pending actions, optionally filtered by an ASHA worker ID
 */
export const detectMissedActions = async (ashaId = null) => {
  // Fetch both MISSED and Scheduled (PENDING) tasks so the worker can action them
  const query = { status: { $in: ['MISSED', 'PENDING'] } };
  
  if (ashaId) {
    query.ashaId = ashaId; // If filtering by the requesting ASHA worker
  } else {
    // Alternatively, filter by patient's assigned ashaId
    // But since the schema has ashaId, we can just use the direct reference if provided during log
  }

  // Populate patient details to display in the dashboard
  const missedActions = await Compliance.find(query)
    .populate('patientId', 'name phone age village region')
    .sort({ date: -1 });

  return missedActions;
};

/**
 * Specifically resolve an existing MISSED or PENDING action by changing its status to COMPLETED
 */
export const resolveMissedTask = async (taskId) => {
  const compliance = await Compliance.findById(taskId);
  if (!compliance) throw new Error('Compliance record not found');

  if (compliance.status !== 'MISSED' && compliance.status !== 'PENDING') {
    throw new Error('Can only resolve MISSED or PENDING actions');
  }

  compliance.status = 'COMPLETED';
  
  await compliance.save();
  return compliance;
};
