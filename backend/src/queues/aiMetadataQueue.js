const { Queue } = require('bullmq');
const redisClient = require('../config/redis');

const connection = {
  host: redisClient.options.host || 'localhost',
  port: redisClient.options.port || 6379,
};

const aiMetadataQueue = new Queue('ai-metadata', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 200 },
  },
});

async function enqueueAiMetadata(bookId, options = {}) {
  const job = await aiMetadataQueue.add(
    'generate-metadata',
    { bookId, force: options.force || false },
    { jobId: `book-${bookId}` }
  );
  console.log(`[aiMetadataQueue] Job enfileirado para livro ${bookId} — jobId: ${job.id}`);
  return job;
}

module.exports = { aiMetadataQueue, enqueueAiMetadata };

// SEMANA 4: criar backend/src/workers/aiMetadataWorker.js
// que vai consumir esta fila com:
// const { Worker } = require('bullmq');
// new Worker('ai-metadata', async (job) => { ... }, { connection });
