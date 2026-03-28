import { Worker } from 'bullmq';
import { translateAudio } from '../services/voice.service.js';
import translationStore from '../store/translationStore.js';

const redisConnection = {
  host: '127.0.0.1',
  port: 6379,
};

console.log('👷‍♂️ Translation Worker starting...');

// Create a worker that processes jobs from the 'translation' queue
const translationWorker = new Worker(
  'translation',
  async (job) => {
    const { jobId, filePath, originalname } = job.data;
    
    // Update store state to 'processing'
    if (translationStore[jobId]) {
      translationStore[jobId].status = 'processing';
    }

    // Call the audio translation service using the file path provided by multer
    const result = await translateAudio({ path: filePath, originalname });

    return { jobId, translatedText: result.translatedText };
  },
  { 
    connection: redisConnection 
  }
);

// Listen to worker events to update our in-memory store
translationWorker.on('completed', (job, returnvalue) => {
  const { jobId, translatedText } = returnvalue;
  console.log(`✅ Job ${job.id} completed. JobId: ${jobId}`);

  // Update store to 'completed' and add the result text
  if (translationStore[jobId]) {
    translationStore[jobId].status = 'completed';
    translationStore[jobId].translatedText = translatedText;
  }
});

translationWorker.on('failed', (job, err) => {
  const jobId = job.data.jobId;
  console.error(`❌ Job ${job.id} failed. Error: ${err.message}`);

  // Update store to 'failed'
  if (translationStore[jobId]) {
    translationStore[jobId].status = 'failed';
    translationStore[jobId].error = err.message;
  }
});

export default translationWorker;
