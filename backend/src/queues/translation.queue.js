let translationQueue = null;
let translationQueueAvailable = false;

try {
  const { Queue } = await import('bullmq');

  const redisConnection = {
    host: '127.0.0.1',
    port: 6379,
  };

  translationQueue = new Queue('translation', {
    connection: redisConnection,
  });
  translationQueueAvailable = true;
} catch {
  console.warn('BullMQ is not installed. Translation queue will run in fallback mode.');
}

export { translationQueue, translationQueueAvailable };
