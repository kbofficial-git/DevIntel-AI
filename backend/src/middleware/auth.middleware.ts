import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/response';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.userId) {
    return errorResponse(res, 'Authentication required', 401, undefined, 'UNAUTHORIZED');
  }
  next();
}
