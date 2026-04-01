import { PrismaClient } from '@prisma/client';
import type { User, FinancialRecord, AuditLog } from '@prisma/client';

import { logger } from './logger';

const isDev = process.env['NODE_ENV'] !== 'production';

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  (prisma as any).$on('query', (e: any) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const duration = e.duration as number;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const query = e.query as string;
    if (duration > 100) {
      logger.warn({ query, duration: `${duration}ms` }, 'Slow Prisma query');
    }
  });
}

// Log warnings and errors in all environments
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
(prisma as any).$on('warn', (e: any) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
  const message = e.message as string;
  logger.warn({ msg: message }, 'Prisma warning');
});
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
(prisma as any).$on('error', (e: any) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
  const message = e.message as string;
  logger.error({ msg: message }, 'Prisma error');
});

/**
 * Helper to fetch a single record by ID with soft-delete check.
 */
export const getRecordById = async (id: string): Promise<FinancialRecord | null> => {
  return prisma.financialRecord.findFirst({
    where: { id, isDeleted: false },
  });
};

/**
 * Helper to fetch a user by ID with soft-delete check.
 */
export const getUserById = async (id: string): Promise<User | null> => {
  return prisma.user.findFirst({
    where: { id, isDeleted: false },
  });
};

/**
 * Helper to fetch a specific audit log.
 */
export const getAuditLogById = async (id: string): Promise<AuditLog | null> => {
  return prisma.auditLog.findFirst({
    where: { id },
  });
};
