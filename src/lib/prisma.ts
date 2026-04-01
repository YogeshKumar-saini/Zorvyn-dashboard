import { PrismaClient } from '@prisma/client';
import logger from './logger';

const isDev = process.env.NODE_ENV !== 'production';

/**
 * Prisma singleton — avoids creating multiple connections in hot-reload dev.
 * In production, a single global instance is always used.
 * Logs: slow queries and errors in production; all queries in development.
 */
const createPrismaClient = () =>
  new PrismaClient({
    log: isDev
      ? [
          { emit: 'event', level: 'query' },
          { emit: 'event', level: 'warn' },
          { emit: 'event', level: 'error' },
        ]
      : [
          { emit: 'event', level: 'warn' },
          { emit: 'event', level: 'error' },
        ],
  });

declare global {
  // eslint-disable-next-line no-var
  var __prisma: ReturnType<typeof createPrismaClient> | undefined;
}

export const prisma = global.__prisma ?? createPrismaClient();

if (isDev) {
  global.__prisma = prisma;

  // Log all queries in development
  (prisma as ReturnType<typeof createPrismaClient>).$on('query' as never, (e: { query: string; duration: number }) => {
    if (e.duration > 100) {
      // Only log slow queries (>100ms) to avoid noise
      logger.warn({ query: e.query, duration: `${e.duration}ms` }, 'Slow Prisma query');
    }
  });
}

// Log warnings and errors in all environments
(prisma as ReturnType<typeof createPrismaClient>).$on('warn' as never, (e: { message: string }) => {
  logger.warn({ msg: e.message }, 'Prisma warning');
});
(prisma as ReturnType<typeof createPrismaClient>).$on('error' as never, (e: { message: string }) => {
  logger.error({ msg: e.message }, 'Prisma error');
});
