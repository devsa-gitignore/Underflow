import connectDB from './src/config/db.js';
import app from './src/app.js';
import dotenv from 'dotenv';
// import './src/workers/translation.worker.js'; // Initialize the async worker - disabled (bullmq not installed)

dotenv.config();

const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB().then(() => {
  // Start server
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
});