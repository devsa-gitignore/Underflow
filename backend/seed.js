import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';
import Patient from './src/models/Patient.js';
import { GENDER, RISK_LEVELS } from './src/config/constants.js';

dotenv.config();

const seedDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/swasthya-sathi';
    await mongoose.connect(mongoUri);
    console.log('Connected to DB');

    // 1. Create or Find ASHA worker Jash Nikombhe
    const ashaData = {
      name: 'Jash Nikombhe',
      phone: '9876543210',
      region: 'Palghar',
      role: 'ASHA',
      isVerified: true
    };

    let asha = await User.findOne({ phone: ashaData.phone });
    if (!asha) {
      asha = await User.create(ashaData);
      console.log('ASHA worker Jash Nikombhe created successfully');
    } else {
      // Update name just in case it was "Ravi Kumar"
      asha.name = 'Jash Nikombhe';
      await asha.save();
      console.log('ASHA worker Jash Nikombhe already exists (updated)');
    }

    // 2. Clear existing test patients (Optional, but good for a fresh 10)
    await Patient.deleteMany({ ashaId: asha._id });

    // 3. Generate 10 random patients
    const firstNames = ['Aarti', 'Pooja', 'Sunita', 'Rahul', 'Meena', 'Kishan', 'Ramesh', 'Sita', 'Gita', 'Anil', 'Vikram', 'Neha'];
    const lastNames = ['Sharma', 'Patel', 'Devi', 'Kumar', 'Kumari', 'Lal', 'Rao', 'Singh', 'Gupta', 'Joshi'];
    const villages = ['Ward 1', 'Ward 2', 'Ward 4', 'Ward 5'];
    
    const patientsToInsert = [];

    for (let i = 0; i < 10; i++) {
      const isFemale = Math.random() > 0.4; // 60% female
      const fName = firstNames[Math.floor(Math.random() * (isFemale ? 6 : 6) + (isFemale ? 0 : 5))]; 
      // Just grab a random name, logic isn't perfect but fine for mock
      const lName = lastNames[Math.floor(Math.random() * lastNames.length)];
      
      const randomRisk = Object.values(RISK_LEVELS)[Math.floor(Math.random() * 4)];
      const randomAge = Math.floor(Math.random() * 60) + 1; // 1 to 60
      const genId = `SS-${Math.floor(100000 + Math.random() * 900000)}`;

      patientsToInsert.push({
        name: `${fName} ${lName}`,
        age: randomAge,
        gender: isFemale ? GENDER.FEMALE : GENDER.MALE,
        phone: `+91 ${Math.floor(6000000000 + Math.random() * 3999999999)}`,
        village: villages[Math.floor(Math.random() * villages.length)],
        region: 'Palghar',
        ashaId: asha._id,
        // Mock a DB object ID or use random string for QR, wait Patient schema doesn't require QR but it's good to have
        qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${genId}`,
        currentRiskLevel: randomRisk,
        isPregnant: isFemale && randomAge > 18 && randomAge < 45 && Math.random() > 0.6,
      });
    }

    const inserted = await Patient.insertMany(patientsToInsert);
    console.log(`Successfully inserted ${inserted.length} mock patients for Jash Nikombhe`);

  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from DB');
  }
};

seedDB();
