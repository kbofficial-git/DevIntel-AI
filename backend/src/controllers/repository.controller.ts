import { Request, Response, NextFunction } from 'express';
import { repositoryService } from '../services/repository/repository.service';
import { connectRepositorySchema, repositoryIdParamSchema } from '../schemas/repository.schema';
import { successResponse } from '../utils/response';

export const repositoryController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const repos = await repositoryService.listConnected(req.session.userId!);
      return successResponse(res, repos);
    } catch (err) {
      next(err);
    }
  },

  async connect(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = connectRepositorySchema.parse(req.body);
      const repo = await repositoryService.connect(req.session.userId!, validated);
      return successResponse(res, repo, 201);
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = repositoryIdParamSchema.parse(req.params);
      const repo = await repositoryService.getById(id, req.session.userId!);
      return successResponse(res, repo);
    } catch (err) {
      next(err);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = repositoryIdParamSchema.parse(req.params);
      await repositoryService.delete(id, req.session.userId!);
      return successResponse(res, { message: 'Repository removed successfully' });
    } catch (err) {
      next(err);
    }
  },

  async listGitHub(req: Request, res: Response, next: NextFunction) {
    try {
      const repos = await repositoryService.listAvailableGitHub(req.session.userId!);
      return successResponse(res, repos);
    } catch (err) {
      next(err);
    }
  },
};
