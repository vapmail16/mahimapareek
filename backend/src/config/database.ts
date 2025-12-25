import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

// Create Prisma client instance
const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'event' },
    { level: 'warn', emit: 'event' },
  ],
});

// Log database queries in development
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query' as any, (e: any) => {
    logger.debug('Database query', {
      query: e.query,
      params: e.params,
      duration: `${e.duration}ms`,
    });
  });
}

// Log database errors
prisma.$on('error' as any, (e: any) => {
  logger.error('Database error', {
    message: e.message,
    target: e.target,
  });
});

// Log database warnings
prisma.$on('warn' as any, (e: any) => {
  logger.warn('Database warning', {
    message: e.message,
  });
});

/**
 * Connect to database
 */
export const connectDatabase = async () => {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');
  } catch (error) {
    logger.error('Database connection failed', { error });
    throw error;
  }
};

/**
 * Disconnect from database
 */
export const disconnectDatabase = async () => {
  try {
    await prisma.$disconnect();
    logger.info('Database disconnected successfully');
  } catch (error) {
    logger.error('Database disconnection failed', { error });
  }
};

export { prisma };
export default prisma;

