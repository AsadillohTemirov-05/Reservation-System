import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  name: process.env.APP_NAME || 'Seat Reservation System',
  reservationExpiryMinutes: parseInt(process.env.RESERVATION_EXPIRY_MINUTES || '2', 10),
  reservationCleanupIntervalSeconds: parseInt(
    process.env.RESERVATION_CLEANUP_INTERVAL_SECONDS || '30',
    10,
  ),
  maxConcurrentReservations: parseInt(
    process.env.MAX_CONCURRENT_RESERVATIONS || '1000',
    10,
  ),
  logLevel: process.env.LOG_LEVEL || 'debug',
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3001'],
  apiPrefix: process.env.API_PREFIX || 'api',
  apiVersion: process.env.API_VERSION || 'v1',
}));