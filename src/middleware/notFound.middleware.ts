import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

/**
 * Catch-all 404 handler.
 * Must be registered AFTER all route handlers and BEFORE the error handler.
 * Returns a JSON 404 instead of Express's default HTML response.
 */
export function notFound(req: Request, res: Response, _next: NextFunction): void {
  sendError(res, `Route ${req.method} ${req.originalUrl} not found`, 404);
}
