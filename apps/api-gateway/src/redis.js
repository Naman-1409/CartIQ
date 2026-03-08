/**
 * Redis client singleton — used for caching search results and storing
 * live search state for SSE streaming.
 */
const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  retryStrategy: (times) => times > 3 ? null : 100, // Stop retrying after 3 attempts
  lazyConnect: true,
  enableOfflineQueue: false, // Don't queue commands if Redis is down
  commandTimeout: 1000,      // Fail fast if Redis hangs
});

redis.on('connect', () => console.log('✅ Redis connected'));
redis.on('error', (err) => console.warn('⚠️  Redis error (non-fatal):', err.message));

module.exports = redis;
