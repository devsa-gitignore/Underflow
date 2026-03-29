let translationQueue = null;
let translationQueueAvailable = false;

import { getRedisConnectionConfig } from '../config/redis.js';

try {
  const { Queue } = await import('bullmq');
  const redisConfig = getRedisConnectionConfig();

  if (!redisConfig.enabled) {
    console.warn(redisConfig.reason);
  } else {
    translationQueue = new Queue('translation', {
      connection: redisConfig.connection,
    });
    translationQueueAvailable = true;

    translationQueue.on('error', (err) => {
      console.error(`Translation queue Redis error: ${err.message}`);
    });

    console.log(`Translation queue enabled using ${redisConfig.source}.`);
  }
} catch (err) {
  console.warn(`BullMQ queue not started. Falling back to inline translation. ${err.message}`);
}

export { translationQueue, translationQueueAvailable };
