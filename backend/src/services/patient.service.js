import Patient from '../models/Patient.js';
import { generatePatientQR as createQRDataURL } from '../utils/generateQR.js';

export const createPatient = async (patientData, ashaId) => {
  const patient = await Patient.create({
    ...patientData,
    ashaId,
  });
  return patient;
};

export const bulkCreatePatients = async (patientsArray, ashaId) => {
  const patientsWithAsha = patientsArray.map((p) => ({
    ...p,
    ashaId,
  }));
  const patients = await Patient.insertMany(patientsWithAsha);
  return patients;
};

export const getPatientById = async (id) => {
  const patient = await Patient.findOne({ _id: id, isDeleted: false });
  if (!patient) {
    throw new Error('Patient not found');
  }
  return patient;
};

export const searchPatients = async (query, village, region) => {
  let findQuery = { isDeleted: false };
  if (query) {
    findQuery.name = { $regex: query, $options: 'i' };
  }
  if (village) {
    findQuery.village = { $regex: village, $options: 'i' };
  }
  if (region) {
    findQuery.region = { $regex: region, $options: 'i' };
  }
  const patients = await Patient.find(findQuery);
  // Ensure we have varied tasks for the directory view demo
  return patients.map(p => {
    const doc = p.toObject();
    if (!doc.pendingTask || doc.pendingTask === 'Routine Checkup' || doc.pendingTask === 'Awaiting Assessment') {
      if (doc.isPregnant) doc.pendingTask = 'Maternal Follow-up';
      else if (doc.currentRiskLevel === 'CRITICAL' || doc.currentRiskLevel === 'HIGH') doc.pendingTask = 'High Risk monitoring';
      else if (doc.age < 15) doc.pendingTask = 'Vaccination';
    }
    return doc;
  });
};

export const updatePatient = async (id, updateData) => {
  const patient = await Patient.findOneAndUpdate(
    { _id: id, isDeleted: false },
    updateData,
    { new: true, runValidators: true }
  );
  if (!patient) {
    throw new Error('Patient not found');
  }
  return patient;
};

export const softDeletePatient = async (id) => {
  const patient = await Patient.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { isDeleted: true },
    { new: true }
  );
  if (!patient) {
    throw new Error('Patient not found');
  }
  return { message: 'Patient removed successfully' };
};

export const generatePatientQR = async (patientId) => {
  const patient = await Patient.findOne({ _id: patientId, isDeleted: false });
  if (!patient) {
    throw new Error('Patient not found');
  }

  // Keep the QR payload minimal so it remains easy to scan from screenshots.
  const qrDataURL = await createQRDataURL(String(patient._id));
  patient.qrCode = qrDataURL;
  await patient.save();
  return patient;
};
