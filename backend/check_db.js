import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';

dotenv.config();

const checkUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const count = await User.countDocuments();
    const users = await User.find({});
    console.log(`Total users: ${count}`);
    console.log('Users in DB:', users);
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
};

checkUsers();
