import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../lib/prisma';
import { sendError } from '../utils/response';
import { STATUS } from '../constants';

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  jti?: string; // JWT ID for blacklisting
}

/**
 * In-memory JWT blacklist for token revocation (logout).
 * In production, replace with Redis for multi-instance support.
 * Key: jti (JWT ID), Value: expiry timestamp (ms) for auto-cleanup.
 */
const tokenBlacklist = new Map<string, number>();

/** Adds a token's jti to the blacklist until its natural expiry */
export function blacklistToken(jti: string, expiresAt: number): void {
  tokenBlacklist.set(jti, expiresAt);
  // Cleanup expired entries periodically to prevent memory leaks
  const now = Date.now();
  for (const [key, expiry] of tokenBlacklist.entries()) {
    if (expiry < now) tokenBlacklist.delete(key);
  }
}

/** Checks if a token's jti is in the blacklist */
export function isTokenBlacklisted(jti: string): boolean {
  const expiry = tokenBlacklist.get(jti);
  if (expiry === undefined) return false;
  if (expiry < Date.now()) {
    tokenBlacklist.delete(jti);
    return false;
  }
  return true;
}

/**
 * Verifies JWT token and attaches the full user to req.user.
 * Guards:
 *   - Missing / malformed token → 401
 *   - Expired token             → 401
 *   - Blacklisted token (logout)→ 401
 *   - User not found            → 401
 *   - User INACTIVE/SUSPENDED   → 403
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    sendError(res, 'Authentication required. Provide a Bearer token.', 401);
    return;
  }

  const token = authHeader.split(' ')[1] ?? '';

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    // Check token blacklist (logout)
    if (decoded.jti && isTokenBlacklisted(decoded.jti)) {
      sendError(res, 'Token has been revoked. Please log in again.', 401);
      return;
    }

    // Fetch fresh user from DB — catches deactivated/deleted users mid-session
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId, isDeleted: false },
      select: { id: true, email: true, name: true, role: true, status: true },
    });

    if (!user) {
      sendError(res, 'User not found. Token is invalid.', 401);
      return;
    }

    if (user.status === STATUS.INACTIVE) {
      sendError(res, 'Your account is inactive. Contact an administrator.', 403);
      return;
    }

    if (user.status === STATUS.SUSPENDED) {
      sendError(res, 'Your account has been suspended. Contact an administrator.', 403);
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as import('../constants').Role,
      status: user.status as import('../constants').UserStatus,
    };
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      sendError(res, 'Token has expired. Please log in again.', 401);
    } else {
      sendError(res, 'Invalid token.', 401);
    }
  }
}
