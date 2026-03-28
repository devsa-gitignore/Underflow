import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';

dotenv.config();

const seedAsha = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const asha = {
      name: 'Ravi Kumar',
      phoneNumber: '9876543210',
      village: 'Palghar',
      role: 'asha'
    };

    const existing = await User.findOne({ phoneNumber: asha.phoneNumber });
    if (existing) {
      console.log('ASHA worker already exists');
    } else {
      await User.create(asha);
      console.log('Test ASHA worker created successfully');
    }
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await mongoose.disconnect();
  }
};

seedAsha();
