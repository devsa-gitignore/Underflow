import { Queue } from 'bullmq';

const redisConnection = {
  host: '127.0.0.1',
  port: 6379,
};

// Create a new queue instance
export const translationQueue = new Queue('translation', { 
  connection: redisConnection 
});
