import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler';
import { reviewInputSchema } from '../services/ai/schemas/review.schema';
import { debugInputSchema } from '../services/ai/schemas/debug.schema';
import { planInputSchema } from '../services/ai/schemas/plan.schema';
import { codeReviewService } from '../services/ai/review/codeReview.service';
import { debuggingService } from '../services/ai/debugging/debugging.service';
import { planningService } from '../services/ai/planning/planning.service';

export const intelligenceController = {
  /**
   * POST /api/repositories/:id/review
   */
  async review(req: Request, res: Response, next: NextFunction) {
    try {
      const repositoryId = req.params.id;
      if (!repositoryId) {
        throw new AppError('Repository ID is required', 400, 'BAD_REQUEST');
      }

      const parseResult = reviewInputSchema.safeParse(req.body);
      if (!parseResult.success) {
        const errorDetails = parseResult.error.errors.map((e) => e.message).join(', ');
        throw new AppError(`Invalid review request: ${errorDetails}`, 400, 'BAD_REQUEST');
      }

      const userId = req.session.userId!;
      const result = await codeReviewService.review(userId, repositoryId, parseResult.data);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/repositories/:id/debug
   */
  async debug(req: Request, res: Response, next: NextFunction) {
    try {
      const repositoryId = req.params.id;
      if (!repositoryId) {
        throw new AppError('Repository ID is required', 400, 'BAD_REQUEST');
      }

      const parseResult = debugInputSchema.safeParse(req.body);
      if (!parseResult.success) {
        const errorDetails = parseResult.error.errors.map((e) => e.message).join(', ');
        throw new AppError(`Invalid debug request: ${errorDetails}`, 400, 'BAD_REQUEST');
      }

      const userId = req.session.userId!;
      const result = await debuggingService.debug(userId, repositoryId, parseResult.data);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/repositories/:id/plan
   */
  async plan(req: Request, res: Response, next: NextFunction) {
    try {
      const repositoryId = req.params.id;
      if (!repositoryId) {
        throw new AppError('Repository ID is required', 400, 'BAD_REQUEST');
      }

      const parseResult = planInputSchema.safeParse(req.body);
      if (!parseResult.success) {
        const errorDetails = parseResult.error.errors.map((e) => e.message).join(', ');
        throw new AppError(`Invalid plan request: ${errorDetails}`, 400, 'BAD_REQUEST');
      }

      const userId = req.session.userId!;
      const result = await planningService.createPlan(userId, repositoryId, parseResult.data);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
};
