const Redis = require('ioredis');

const redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  lazyConnect: false,
});

redisClient.on('connect', () => {
  console.log('[Redis] Conectado com sucesso');
});

redisClient.on('error', (err) => {
  console.error('[Redis] Erro de conexão:', err.message);
});

redisClient.on('reconnecting', () => {
  console.warn('[Redis] Tentando reconectar...');
});

module.exports = redisClient;
