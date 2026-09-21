import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../config/logger';
import { env } from '../config/env';
import { errorResponse } from '../utils/response';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code?: string;

  constructor(message: string, statusCode = 500, code?: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this);
  }
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  const requestId = req.id;

  if (err instanceof ZodError) {
    logger.warn({ err, requestId }, 'Validation error');
    errorResponse(res, 'Validation error', 400, err.errors, 'VALIDATION_ERROR');
    return;
  }

  if (err instanceof AppError) {
    logger.warn({ err, requestId }, err.message);
    errorResponse(res, err.message, err.statusCode, undefined, err.code);
    return;
  }

  logger.error({ err, requestId }, 'Unhandled server error');

  const message = env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
  errorResponse(res, message, 500, undefined, 'INTERNAL_SERVER_ERROR');
}
