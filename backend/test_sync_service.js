import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { processSyncUpload, getLatestAshaData } from './src/services/sync.service.js';
import User from './src/models/User.js';
import Patient from './src/models/Patient.js';
import Visit from './src/models/Visit.js';

dotenv.config();

const runTest = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // 1. Find or create an ASHA worker for testing
    let asha = await User.findOne({ role: 'ASHA' });
    if (!asha) {
      asha = await User.create({
        name: 'Test ASHA',
        phone: '1234567890',
        region: 'Test Region',
        role: 'ASHA'
      });
    }
    const ashaId = asha._id.toString();
    console.log(`Using ASHA ID: ${ashaId}`);

    // 2. Prepare mock actions
    const actions = [
      {
        type: 'CREATE_PATIENT',
        data: {
          tempId: 'temp_p1',
          name: 'Offline Patient 1',
          age: 30,
          gender: 'FEMALE',
          village: 'Offline Village'
        },
        timestamp: Date.now()
      },
      {
        type: 'ADD_VISIT',
        data: {
          patientId: 'temp_p1', // Should be resolved
          notes: 'First offline visit',
          riskLevel: 'LOW',
          visitDate: new Date()
        },
        timestamp: Date.now()
      }
    ];

    // 3. Process Sync
    console.log('--- Processing Sync Upload ---');
    const uploadResult = await processSyncUpload(ashaId, actions);
    console.log('Upload Result:', uploadResult);

    // 4. Verify creation
    const patient = await Patient.findOne({ name: 'Offline Patient 1', ashaId });
    if (patient) {
      console.log('Successfully found created patient:', patient._id);
      const visit = await Visit.findOne({ patientId: patient._id, ashaId });
      if (visit) {
        console.log('Successfully found associated visit:', visit._id);
      } else {
        console.error('Failed to find associated visit!');
      }
    } else {
      console.error('Failed to find created patient!');
    }

    // 5. Test Download
    console.log('--- Testing Sync Download ---');
    const downloadData = await getLatestAshaData(ashaId);
    console.log('Patients count:', downloadData.patients.length);
    console.log('Alerts count:', downloadData.alerts.length);
    console.log('Followups count:', downloadData.followups.length);

    console.log('Test completed successfully');

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await mongoose.disconnect();
  }
};

runTest();
