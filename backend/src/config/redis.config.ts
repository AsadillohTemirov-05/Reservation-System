import { registerAs } from '@nestjs/config';

export default registerAs('redis', () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0', 10),

  options: {
    retryStrategy: (times: number) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    enableOfflineQueue: true,
    connectTimeout: 10000,
    lazyConnect: false,
  },

  ttl: {
    idempotency: parseInt(process.env.REDIS_IDEMPOTENCY_TTL || '86400', 10),
    lock: parseInt(process.env.REDIS_LOCK_TTL || '10', 10),               
    session: parseInt(process.env.REDIS_SESSION_TTL || '3600', 10),       
    reservation: parseInt(process.env.RESERVATION_EXPIRY_SECONDS || '120', 10),
  },

  prefixes: {
    idempotency: 'idempotency:',
    lock: 'lock:',
    session: 'session:',
    reservation: 'reservation:', 
  },

  enabled: process.env.REDIS_ENABLED !== 'false',
}));