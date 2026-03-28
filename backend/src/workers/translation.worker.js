let translationWorker = null;

try {
  const { Worker } = await import('bullmq');
  const { translateAudio } = await import('../services/voice.service.js');
  const { default: translationStore } = await import('../store/translationStore.js');

  const redisConnection = {
    host: '127.0.0.1',
    port: 6379,
  };

  console.log('Translation Worker starting...');

  translationWorker = new Worker(
    'translation',
    async (job) => {
      const { jobId, filePath, originalname } = job.data;

      if (translationStore[jobId]) {
        translationStore[jobId].status = 'processing';
      }

      const result = await translateAudio({ path: filePath, originalname });
      return { jobId, translatedText: result.translatedText };
    },
    {
      connection: redisConnection,
    }
  );

  translationWorker.on('completed', (job, returnvalue) => {
    const { jobId, translatedText } = returnvalue;
    console.log(`Translation job ${job.id} completed. JobId: ${jobId}`);

    if (translationStore[jobId]) {
      translationStore[jobId].status = 'completed';
      translationStore[jobId].translatedText = translatedText;
    }
  });

  translationWorker.on('failed', (job, err) => {
    const jobId = job?.data?.jobId;
    console.error(`Translation job ${job?.id} failed. Error: ${err.message}`);

    if (jobId && translationStore[jobId]) {
      translationStore[jobId].status = 'failed';
      translationStore[jobId].error = err.message;
    }
  });
} catch {
  console.warn('BullMQ worker not started. Background translation is disabled.');
}

export default translationWorker;
