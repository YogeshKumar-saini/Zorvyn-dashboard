import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { sendError } from '../utils/response';
import { env } from '../config/env';
import logger from '../lib/logger';

/**
 * Global Error Handler Middleware
 * Centralised mapping of all known error types to clean JSON responses.
 * Logs with structured Pino — all errors include the request trace ID.
 */
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const reqId = req.reqId ?? 'unknown';

  // ─── Zod Validation Errors ─────────────────────────────────────────────────
  if (err instanceof ZodError) {
    logger.warn({ reqId, issues: err.flatten().fieldErrors }, 'Validation failed');
    sendError(res, 'Validation failed', 422, err.flatten().fieldErrors);
    return;
  }

  // ─── Prisma Errors ─────────────────────────────────────────────────────────
  if (typeof err === 'object' && err !== null && 'code' in err) {
    const prismaErr = err as { code: string; meta?: { target?: string[] } };

    if (prismaErr.code === 'P2002') {
      const fields = prismaErr.meta?.target?.join(', ') ?? 'field';
      logger.warn({ reqId, code: 'P2002', fields }, 'Unique constraint violation');
      sendError(res, `A record with this ${fields} already exists.`, 409);
      return;
    }

    if (prismaErr.code === 'P2025') {
      logger.warn({ reqId, code: 'P2025' }, 'Record not found');
      sendError(res, 'The requested record was not found.', 404);
      return;
    }
  }

  // ─── AppError (custom thrown errors with a .status) ────────────────────────
  if (err instanceof Error && 'status' in err) {
    const appErr = err as Error & { status: number };
    logger.warn({ reqId, status: appErr.status, message: appErr.message }, 'Application error');
    sendError(res, appErr.message, appErr.status);
    return;
  }

  // ─── Default 500 ───────────────────────────────────────────────────────────
  const message = err instanceof Error ? err.message : 'An unknown error occurred';
  logger.error({ reqId, err }, 'Unhandled server error');

  sendError(
    res,
    env.NODE_ENV === 'production' ? 'An internal server error occurred.' : message,
    500
  );
}
