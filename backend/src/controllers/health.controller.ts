import { Request, Response, NextFunction } from 'express';
import { healthService } from '../services/health.service';
import { successResponse } from '../utils/response';

export class HealthController {
  async getHealth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const health = await healthService.checkHealth();
      const statusCode = health.status === 'ok' ? 200 : 200; // Return 200 so monitoring gets structured JSON
      successResponse(res, health, statusCode);
    } catch (error) {
      next(error);
    }
  }
}

export const healthController = new HealthController();
