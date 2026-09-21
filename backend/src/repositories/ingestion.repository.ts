import { prisma } from '../config/database';
import { IngestionStatus } from '@prisma/client';
import { logger } from '../config/logger';

export const ingestionRepository = {
  async createJob(repositoryId: string, commitSha?: string) {
    return prisma.ingestionJob.create({
      data: {
        repositoryId,
        status: IngestionStatus.QUEUED,
        commitSha,
        startedAt: new Date(),
      },
    });
  },

  async getJobById(id: string) {
    return prisma.ingestionJob.findUnique({
      where: { id },
    });
  },

  async getLatestJobByRepository(repositoryId: string) {
    return prisma.ingestionJob.findFirst({
      where: { repositoryId },
      orderBy: { createdAt: 'desc' },
    });
  },

  async updateJobProgress(
    id: string,
    data: {
      status?: IngestionStatus;
      totalFiles?: number;
      processedFiles?: number;
      totalChunks?: number;
    }
  ) {
    return prisma.ingestionJob.update({
      where: { id },
      data,
    });
  },

  async completeJob(id: string, totalChunks: number) {
    const job = await prisma.ingestionJob.update({
      where: { id },
      data: {
        status: IngestionStatus.COMPLETED,
        totalChunks,
        completedAt: new Date(),
      },
    });

    // Update the repository's lastIndexedAt timestamp
    await prisma.repository.update({
      where: { id: job.repositoryId },
      data: { lastIndexedAt: new Date() },
    });

    return job;
  },

  async failJob(id: string, errorMessage: string) {
    logger.error({ jobId: id, errorMessage }, 'Ingestion job failed');
    return prisma.ingestionJob.update({
      where: { id },
      data: {
        status: IngestionStatus.FAILED,
        errorMessage,
        completedAt: new Date(),
      },
    });
  },
};
