import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { env } from '../config/env';

/**
 * Standard rate limiter response formatter
 */
const rateLimitHandler = (message: string) => {
  return (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message,
      },
    });
  };
};

/**
 * Global rate limiter: protects general API routes from abuse.
 */
export const globalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => env.NODE_ENV === 'test' && !process.env.TEST_RATE_LIMIT,
  handler: rateLimitHandler(
    `Too many requests from this IP. Please try again in ${Math.round(
      env.RATE_LIMIT_WINDOW_MS / 1000
    )} seconds.`
  ),
});

/**
 * Strict AI rate limiter: protects expensive embedding, retrieval, and LLM endpoints.
 */
export const aiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.AI_RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => env.NODE_ENV === 'test' && !process.env.TEST_RATE_LIMIT,
  handler: rateLimitHandler(
    `AI request limit exceeded (${env.AI_RATE_LIMIT_MAX_REQUESTS} req/min). Please slow down and try again shortly.`
  ),
});
