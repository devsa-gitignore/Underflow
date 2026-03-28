import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Patient from './src/models/Patient.js';
import User from './src/models/User.js';

dotenv.config();

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('CONNECTED TO DB');

    // 1. Get the ASHA worker (Jash Nikombhe) from seed.js
    const asha = await User.findOne({ phone: '9876543210' });
    if (!asha) {
      console.log('ASHA NOT FOUND - CHECK IF SEED.JS RAN');
      return;
    }

    // 2. Varied Patients
    const patients = [
      { name: 'Amit Sharma', age: 45, village: 'Palghar', gender: 'Male', phone: '9000000001', currentRiskLevel: 'LOW', pendingTask: 'Vaccination' },
      { name: 'Sneha', age: 28, village: 'Vada', gender: 'Female', phone: '9000000002', currentRiskLevel: 'LOW', pendingTask: 'Maternal Follow-up', isPregnant: true },
      { name: 'Rahul', age: 10, village: 'Palghar', gender: 'Male', phone: '9000000003', currentRiskLevel: 'LOW', pendingTask: 'Routine Checkup' },
      { name: 'Kishan Joshi', age: 22, village: 'Ward 1', gender: 'Male', phone: '9000000004', currentRiskLevel: 'CRITICAL', pendingTask: 'High Risk monitoring' },
      { name: 'Aarti Kumar', age: 54, village: 'Ward 4', gender: 'Female', phone: '9000000005', currentRiskLevel: 'HIGH', pendingTask: 'High Risk monitoring' },
      { name: 'Anil Devi', age: 3, village: 'Ward 1', gender: 'Male', phone: '9000000006', currentRiskLevel: 'HIGH', pendingTask: 'Vaccination' }
    ];

    // Delete existing for this ASHA only to preserve the others if they exist
    await Patient.deleteMany({ ashaId: asha._id });
    
    const seeded = await Patient.insertMany(patients.map(p => ({ ...p, ashaId: asha._id, region: 'Palghar' })));
    console.log(`SEEDED ${seeded.length} PATIENTS FOR ASHA ${asha.name}`);
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
};

seed();
