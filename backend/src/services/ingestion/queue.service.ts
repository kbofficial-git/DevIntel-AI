import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { AppError } from '../../middleware/errorHandler';

export interface IngestionJobData {
  jobId: string;
  repositoryId: string;
  userId: string;
}

export const INGESTION_QUEUE_NAME = 'repository-ingestion';

const isTest = env.NODE_ENV === 'test';

const redisConnection = new IORedis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  lazyConnect: true,
  retryStrategy: isTest ? () => null : (times) => Math.min(times * 100, 3000),
});

redisConnection.on('error', (err) => {
  if (!isTest) {
    logger.error(
      { err: err.message, host: env.REDIS_HOST, port: env.REDIS_PORT },
      'Redis connection error. Ensure Redis is running via "docker compose up -d redis".'
    );
  }
});

let queueInstance: Queue<IngestionJobData> | null = null;

export function getIngestionQueue(): Queue<IngestionJobData> {
  if (!queueInstance) {
    queueInstance = new Queue<IngestionJobData>(INGESTION_QUEUE_NAME, {
      connection: redisConnection,
    });
  }
  return queueInstance;
}

export async function addIngestionJob(data: IngestionJobData): Promise<Job<IngestionJobData>> {
  try {
    if (redisConnection.status !== 'ready' && redisConnection.status !== 'connecting') {
      await redisConnection.connect();
    }

    const queue = getIngestionQueue();
    const job = await queue.add(`ingest-${data.repositoryId}`, data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    });

    logger.info({ jobId: data.jobId, queueJobId: job.id, repositoryId: data.repositoryId }, 'Ingestion job enqueued in BullMQ');
    return job;
  } catch (error) {
    logger.error({ err: error }, 'Failed to enqueue ingestion job to Redis');
    throw new AppError(
      `Redis connection failed. Ensure Redis is running locally on port ${env.REDIS_PORT} (run 'docker compose up -d redis') or verify REDIS_HOST/REDIS_PORT in your environment.`,
      503,
      'SERVICE_UNAVAILABLE'
    );
  }
}

let workerInstance: Worker<IngestionJobData> | null = null;

export function initIngestionWorker(
  processor: (job: Job<IngestionJobData>) => Promise<void>
): Worker<IngestionJobData> {
  if (!workerInstance) {
    workerInstance = new Worker<IngestionJobData>(
      INGESTION_QUEUE_NAME,
      async (job) => {
        logger.info({ queueJobId: job.id, repoId: job.data.repositoryId }, 'Starting BullMQ ingestion job processing');
        await processor(job);
      },
      {
        connection: redisConnection,
        concurrency: 2,
      }
    );

    workerInstance.on('completed', (job) => {
      logger.info({ queueJobId: job.id, repoId: job.data.repositoryId }, 'Ingestion job successfully completed in worker');
    });

    workerInstance.on('failed', (job, err) => {
      logger.error({ queueJobId: job?.id, err: err.message }, 'Ingestion job failed in worker');
    });
  }

  return workerInstance;
}

export async function checkRedisHealth(): Promise<{ status: 'healthy' | 'unhealthy'; error?: string }> {
  try {
    if (env.NODE_ENV === 'test') {
      return { status: 'healthy' };
    }
    if (redisConnection.status !== 'ready' && redisConnection.status !== 'connecting') {
      await redisConnection.connect();
    }
    const pong = await redisConnection.ping();
    return pong === 'PONG' ? { status: 'healthy' } : { status: 'unhealthy', error: 'Unexpected ping response' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Redis connection failed';
    return { status: 'unhealthy', error: message };
  }
}

