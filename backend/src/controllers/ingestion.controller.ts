import { Request, Response, NextFunction } from 'express';
import { ingestionService } from '../services/ingestion/ingestion.service';
import { repositoryIdParamSchema } from '../schemas/repository.schema';
import { successResponse } from '../utils/response';

export const ingestionController = {
  async trigger(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = repositoryIdParamSchema.parse(req.params);
      const result = await ingestionService.triggerIngestion(req.session.userId!, id);
      return successResponse(res, result, 202);
    } catch (err) {
      next(err);
    }
  },

  async status(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = repositoryIdParamSchema.parse(req.params);
      const status = await ingestionService.getIngestionStatus(req.session.userId!, id);
      return successResponse(res, status);
    } catch (err) {
      next(err);
    }
  },
};
