import { z } from 'zod';
import { prisma } from '../config/database';
import { repositoryRepository } from '../repositories/repository.repository';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../config/logger';

export const feedbackInputSchema = z.object({
  capability: z.enum(['chat', 'review', 'debug', 'plan'], {
    required_error: 'Capability is required',
  }),
  rating: z.union([z.literal(1), z.literal(-1)], {
    required_error: 'Rating must be 1 (positive) or -1 (negative)',
  }),
  comment: z.string().max(1000, 'Comment cannot exceed 1000 characters').optional(),
  referenceId: z.string().max(100).optional(),
});

export type FeedbackInput = z.infer<typeof feedbackInputSchema>;

export const feedbackService = {
  async recordFeedback(userId: string, repositoryId: string, input: FeedbackInput) {
    // 1. Verify repository ownership
    const repo = await repositoryRepository.findByIdAndUser(repositoryId, userId);
    if (!repo) {
      throw new AppError('Repository not found', 404, 'NOT_FOUND');
    }

    // 2. Persist feedback
    const feedback = await (prisma as any).feedback.create({
      data: {
        userId,
        repositoryId,
        capability: input.capability,
        rating: input.rating,
        comment: input.comment,
        referenceId: input.referenceId,
      },
    });

    logger.info(
      {
        feedbackId: feedback.id,
        userId,
        repoId: repositoryId,
        capability: input.capability,
        rating: input.rating,
      },
      'User feedback recorded for AI capability'
    );

    return feedback;
  },
};
