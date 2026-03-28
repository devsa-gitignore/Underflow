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

    // 1.5 Generate 9 more ASHA workers to total 10
    const extraNames = ['Priya Patel', 'Sunita Devi', 'Meena Kumari', 'Kavita Singh', 'Anjali Desai', 'Neha Gupta', 'Rani Mukerji', 'Ankita Lokhande', 'Swara Bhaskar'];
    const extraWards = ['Ward 1', 'Ward 2', 'Ward 3', 'Ward 4', 'Ward 5'];
    
    await User.deleteMany({ role: 'ASHA', phone: { $ne: '9876543210' } }); // clear old extra workers
    const additionalWorkers = extraNames.map((name, idx) => ({
      name,
      phone: `987650000${idx}`,
      region: extraWards[Math.floor(Math.random() * extraWards.length)],
      role: 'ASHA',
      isVerified: true
    }));
    await User.insertMany(additionalWorkers);
    console.log(`Created 9 extra ASHA workers`);

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
        pendingTask: isFemale && Math.random() > 0.6 ? 'Maternal Follow-up' : 
                     randomRisk === 'CRITICAL' || randomRisk === 'HIGH' ? 'High Risk monitoring' :
                     Math.random() > 0.5 ? 'Vaccination' : 'Routine Checkup',
      });
    }

    const inserted = await Patient.insertMany(patientsToInsert);
    console.log(`Successfully inserted ${inserted.length} mock patients for Jash Nikombhe`);

    // 4. Seed Visit History for each patient
    const Visit = (await import('./src/models/Visit.js')).default;
    await Visit.deleteMany({ ashaId: asha._id });

    const symptomPool = [
      ['Mild fatigue', 'Occasional backache'],
      ['Severe Headaches', 'Swelling in hands/face'],
      ['Fever', 'Body aches', 'Cough'],
      ['No symptoms'],
      ['Low appetite', 'Nausea'],
      ['Dizziness', 'Blurred vision'],
    ];
    const notePool = [
      'Routine checkup completed. Patient vitals stable. Advised to continue current medication.',
      'ANC follow-up visit. Fetal development normal. Iron supplementation provided for 30 days.',
      'Patient reported mild symptoms. BP slightly elevated. Advised rest and low-sodium diet.',
      'Vaccination administered as per schedule. No adverse reactions observed.',
      'High-risk monitoring visit. Referred to PHC for further assessment based on vitals.',
      'Growth monitoring completed. Weight and height within normal range for age.',
    ];
    const bpOptions = ['120/80', '130/85', '140/90', '110/70', '160/100', '135/88'];

    const visitsToInsert = [];
    for (const patient of inserted) {
      const numVisits = Math.floor(Math.random() * 3) + 1; // 1-3 visits
      for (let v = 0; v < numVisits; v++) {
        const daysAgo = Math.floor(Math.random() * 90) + 1;
        visitsToInsert.push({
          patientId: patient._id,
          ashaId: asha._id,
          symptoms: symptomPool[Math.floor(Math.random() * symptomPool.length)],
          notes: notePool[Math.floor(Math.random() * notePool.length)],
          vitals: {
            temperature: +(97 + Math.random() * 3).toFixed(1),
            bloodPressure: bpOptions[Math.floor(Math.random() * bpOptions.length)],
            weight: Math.floor(40 + Math.random() * 40),
          },
          riskLevel: patient.currentRiskLevel,
          visitDate: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
        });
      }
    }
    const insertedVisits = await Visit.insertMany(visitsToInsert);
    console.log(`Successfully inserted ${insertedVisits.length} mock visits`);

  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from DB');
  }

};

seedDB();
