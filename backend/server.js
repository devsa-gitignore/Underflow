import connectDB from './src/config/db.js';
import app from './src/app.js';
import dotenv from 'dotenv';
import { startFollowUpJob } from './src/jobs/followup.job.js';
import './src/workers/translation.worker.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB().then(() => {
  // Start server
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    
    // Start automated background jobs
    startFollowUpJob();
  });
});