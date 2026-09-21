import { app } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { prisma } from './config/database';
import { initIngestionWorker } from './services/ingestion/queue.service';
import { ingestionService } from './services/ingestion/ingestion.service';

// Initialize BullMQ background worker in non-test environments
if (env.NODE_ENV !== 'test') {
  try {
    initIngestionWorker(async (job) => {
      await ingestionService.processIngestionJob(job.data);
    });
    logger.info('BullMQ repository ingestion worker initialized');
  } catch (err) {
    logger.warn({ err }, 'Could not initialize BullMQ worker at startup');
  }
}

const server = app.listen(env.PORT, () => {
  logger.info(
    {
      port: env.PORT,
      env: env.NODE_ENV,
      prefix: env.API_PREFIX,
    },
    `DevIntel AI Backend Server started on port ${env.PORT}`
  );
});

async function gracefulShutdown(signal: string) {
  logger.info({ signal }, 'Graceful shutdown initiated');

  server.close(async () => {
    logger.info('HTTP server closed');
    try {
      await prisma.$disconnect();
      logger.info('Database connection closed');
    } catch (err) {
      logger.error({ err }, 'Error during database disconnection');
    }
    process.exit(0);
  });

  // Force close after 10s timeout
  setTimeout(() => {
    logger.error('Forced shutdown due to timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default server;
