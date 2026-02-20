import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  uri:
    process.env.MONGODB_URI ||
    'mongodb://localhost:27017/seat-reservation',
  database: process.env.MONGODB_DATABASE || 'Ticket-System',

  options: {
    retryWrites: true,
    w: 'majority',
    maxPoolSize: parseInt(process.env.MONGODB_POOL_SIZE || '10', 10),
    minPoolSize: 2,
    serverSelectionTimeoutMS: 10000, 
    socketTimeoutMS: 45000,
    family: 4,
  },

  useNewUrlParser: true,
  useUnifiedTopology: true,
  autoIndex: process.env.NODE_ENV !== 'production',

  poolSize: parseInt(process.env.MONGODB_POOL_SIZE || '10', 10),

  debug: process.env.NODE_ENV === 'development',
}));