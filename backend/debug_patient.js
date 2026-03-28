import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Patient from './src/models/Patient.js';

dotenv.config();

const debug = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const p = await Patient.findOne({});
    console.log('DEBUG PATIENT FIELD:', p?.pendingTask);
    console.log('FULL PATIENT:', JSON.stringify(p, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
};

debug();
