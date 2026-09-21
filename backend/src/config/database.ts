import { PrismaClient } from '@prisma/client';
import { env } from './env';
import { logger } from './logger';

export const prisma: PrismaClient = new PrismaClient({
  datasources: {
    db: {
      url: env.DATABASE_URL,
    },
  },
  log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

export async function checkDatabaseConnection(): Promise<{ connected: boolean; error?: string }> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { connected: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown database error';
    logger.warn({ err: error }, 'Database connection check failed');
    return { connected: false, error: message };
  }
}
