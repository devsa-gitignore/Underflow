import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Patient from './src/models/Patient.js';

dotenv.config();

const updateAllPatients = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const patients = await Patient.find({});
    console.log(`Found ${patients.length} patients. Updating...`);

    for (const patient of patients) {
      const randomRisk = patient.currentRiskLevel;
      const tasks = ['Vaccination', 'Routine Checkup', 'BP Check', 'Weight Update'];
      const maternalTasks = ['Maternal Follow-up', 'ANC Checkup'];
      
      let task;
      if (patient.isPregnant) {
        task = maternalTasks[Math.floor(Math.random() * maternalTasks.length)];
      } else if (randomRisk === 'CRITICAL' || randomRisk === 'HIGH') {
        task = 'High Risk monitoring';
      } else {
        task = tasks[Math.floor(Math.random() * tasks.length)];
      }

      patient.pendingTask = task;
      await patient.save();
    }

    console.log('Updated all patients successfully');
  } catch (error) {
    console.error('Error updating patients:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from DB');
  }
};

updateAllPatients();
