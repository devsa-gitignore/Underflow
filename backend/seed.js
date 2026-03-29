import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';
import Patient from './src/models/Patient.js';
import Visit from './src/models/Visit.js';
import { GENDER, RISK_LEVELS, ROLES } from './src/config/constants.js';

dotenv.config();

const BASE_PATIENTS = [
  { name: 'Aarti Sharma', age: 27, gender: GENDER.FEMALE, village: 'Ward 1', region: 'Palghar', risk: RISK_LEVELS.MEDIUM, isPregnant: true, pendingTask: 'Maternal Follow-up' },
  { name: 'Pooja Patel', age: 24, gender: GENDER.FEMALE, village: 'Ward 2', region: 'Palghar', risk: RISK_LEVELS.HIGH, isPregnant: true, pendingTask: 'High Risk monitoring' },
  { name: 'Rahul Kumar', age: 6, gender: GENDER.MALE, village: 'Ward 3', region: 'Palghar', risk: RISK_LEVELS.LOW, isPregnant: false, pendingTask: 'Vaccination' },
  { name: 'Sunita Devi', age: 34, gender: GENDER.FEMALE, village: 'Ward 4', region: 'Palghar', risk: RISK_LEVELS.MEDIUM, isPregnant: false, pendingTask: 'Routine Checkup' },
  { name: 'Meena Kumari', age: 31, gender: GENDER.FEMALE, village: 'Ward 5', region: 'Palghar', risk: RISK_LEVELS.HIGH, isPregnant: false, pendingTask: 'High Risk monitoring' },
  { name: 'Kishan Joshi', age: 42, gender: GENDER.MALE, village: 'Ward 1', region: 'Palghar', risk: RISK_LEVELS.LOW, isPregnant: false, pendingTask: 'Routine Checkup' },
];

const getPhoneNumber = (index) => `+91 90000000${(10 + index).toString().padStart(2, '0')}`;

const buildVisit = (patient, ashaId, visitIndex) => {
  const visitDate = new Date();
  visitDate.setDate(visitDate.getDate() - (visitIndex + 1) * 5);

  const bloodPressureByRisk = {
    [RISK_LEVELS.CRITICAL]: '168/108',
    [RISK_LEVELS.HIGH]: '150/96',
    [RISK_LEVELS.MEDIUM]: '136/88',
    [RISK_LEVELS.LOW]: '118/78',
  };

  return {
    patientId: patient._id,
    ashaId,
    symptoms: patient.isPregnant ? ['Fatigue', 'Back pain'] : ['Routine follow-up'],
    notes: `${patient.name} completed a scheduled ${patient.pendingTask.toLowerCase()} visit.`,
    vitals: {
      temperature: 98.4,
      bloodPressure: bloodPressureByRisk[patient.currentRiskLevel] || '120/80',
      weight: patient.age < 12 ? 22 + visitIndex : 52 + visitIndex * 2,
    },
    riskLevel: patient.currentRiskLevel,
    aiSuggestion: patient.currentRiskLevel === RISK_LEVELS.HIGH || patient.currentRiskLevel === RISK_LEVELS.CRITICAL
      ? 'Refer to PHC and maintain close monitoring.'
      : 'Continue routine monitoring and follow-up.',
    visitDate,
  };
};

const getTargetUsers = async () => {
  return User.find({ role: ROLES.ASHA, phone: /^\+91/ }).sort({ createdAt: 1 }).limit(3);
};

const seedDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/swasthya-sathi';
    await mongoose.connect(mongoUri);
    console.log('Connected to DB');

    const assignedUsers = await getTargetUsers();

    if (assignedUsers.length < 3) {
      throw new Error('Could not find 3 ASHA users with +91 phone numbers to assign patients to.');
    }

    await Visit.deleteMany({});
    await Patient.deleteMany({});
    console.log('Cleared all existing patients and visits');

    const patientsToInsert = BASE_PATIENTS.map((patient, index) => {
      const assignedUser = assignedUsers[Math.floor(index / 2)];
      const qrToken = `SS-${String(index + 1).padStart(3, '0')}-${assignedUser._id.toString().slice(-4)}`;

      return {
        name: patient.name,
        age: patient.age,
        gender: patient.gender,
        phone: getPhoneNumber(index),
        village: patient.village,
        region: patient.region,
        ashaId: assignedUser._id,
        qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${qrToken}`,
        currentRiskLevel: patient.risk,
        isPregnant: patient.isPregnant,
        pendingTask: patient.pendingTask,
      };
    });

    const insertedPatients = await Patient.insertMany(patientsToInsert);

    const visitsToInsert = insertedPatients.flatMap((patient, index) => {
      return [
        buildVisit(patient, patient.ashaId, 0),
        buildVisit(patient, patient.ashaId, 1 + (index % 2)),
      ];
    });

    await Visit.insertMany(visitsToInsert);

    console.log(`Inserted ${insertedPatients.length} patients across ${assignedUsers.length} +91 ASHA users`);
    assignedUsers.forEach((user, index) => {
      const assignedCount = insertedPatients.filter((patient) => String(patient.ashaId) === String(user._id)).length;
      console.log(`- ${user.name} (${user.phone}): ${assignedCount} patients`);
      const patientSlice = insertedPatients.slice(index * 2, index * 2 + 2).map((patient) => patient.name).join(', ');
      console.log(`  Patients: ${patientSlice}`);
    });
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from DB');
  }
};

seedDB();
