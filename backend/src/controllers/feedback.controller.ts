import { Request, Response, NextFunction } from 'express';
import { feedbackService, feedbackInputSchema } from '../services/feedback.service';
import { AppError } from '../middleware/errorHandler';

export const feedbackController = {
  async submit(req: Request, res: Response, next: NextFunction) {
    try {
      const repositoryId = req.params.id;
      if (!repositoryId) {
        throw new AppError('Repository ID is required', 400, 'BAD_REQUEST');
      }

      const parseResult = feedbackInputSchema.safeParse(req.body);
      if (!parseResult.success) {
        const errors = parseResult.error.errors.map((e) => e.message).join(', ');
        throw new AppError(`Invalid feedback data: ${errors}`, 400, 'BAD_REQUEST');
      }

      const userId = req.session.userId!;
      const feedback = await feedbackService.recordFeedback(
        userId,
        repositoryId,
        parseResult.data
      );

      res.status(201).json({
        success: true,
        message: 'Feedback recorded successfully',
        data: {
          id: feedback.id,
          capability: feedback.capability,
          rating: feedback.rating,
        },
      });
    } catch (error) {
      next(error);
    }
  },
};
