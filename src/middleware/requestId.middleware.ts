import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

/**
 * Attaches a unique trace ID to every request.
 * - Reads X-Request-Id header if forwarded by a gateway/proxy
 * - Otherwise generates a new UUID v4
 * - Sets X-Request-Id on the response so clients can correlate logs
 */
export function requestId(req: Request, res: Response, next: NextFunction): void {
  const id = (req.headers['x-request-id'] as string) || randomUUID();
  req.reqId = id;
  res.setHeader('X-Request-Id', id);
  next();
}
