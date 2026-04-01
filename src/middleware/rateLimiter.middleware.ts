import rateLimit from 'express-rate-limit';
import { sendError } from '../utils/response';
import { Request, Response } from 'express';

/**
 * Global rate limiter — applied to all routes.
 * Protects against DDoS and general abuse.
 */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  handler: (_req: Request, res: Response) => {
    sendError(res, 'Too many requests. Please slow down and try again later.', 429);
  },
});

/**
 * Strict auth limiter — applied only to /login and /register.
 * Prevents brute-force and credential stuffing attacks.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                   // 10 attempts per IP per window
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  handler: (_req: Request, res: Response) => {
    sendError(
      res,
      'Too many authentication attempts. Please wait 15 minutes before trying again.',
      429
    );
  },
});
