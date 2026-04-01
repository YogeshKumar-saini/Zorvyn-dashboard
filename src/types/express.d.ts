import type { Role, UserStatus } from '../constants';

/**
 * Augment Express Request with our custom properties.
 * Centralised here — no more scattered `declare global` blocks.
 */
declare global {
  namespace Express {
    interface Request {
      /** Authenticated user attached by the authenticate middleware */
      user?: {
        id: string;
        email: string;
        name: string;
        role: Role;
        status: UserStatus;
      };
      /** Unique per-request trace ID (set by requestId middleware) */
      reqId?: string;
    }
  }
}

export {};
