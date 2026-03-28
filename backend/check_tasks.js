import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Patient from './src/models/Patient.js';

dotenv.config();

const check = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const patients = await Patient.find({});
    console.log(`CHECKING ${patients.length} PATIENTS:`);
    patients.forEach(p => {
      console.log(`Name: ${p.name}, Risk: ${p.currentRiskLevel}, Task: ${p.pendingTask}`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
};

check();
