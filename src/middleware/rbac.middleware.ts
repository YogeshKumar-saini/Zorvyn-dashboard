import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';
import { ROLE, ROLE_HIERARCHY, Role } from '../constants';

/**
 * Returns middleware that allows access only if the authenticated user's
 * role is one of the specified allowed roles.
 *
 * Usage:
 *   router.get('/records', authenticate, requireRole(ROLE.ANALYST, ROLE.ADMIN), handler)
 */
export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Authentication required.', 401);
      return;
    }

    const userRole = req.user.role as Role;

    if (!allowedRoles.includes(userRole)) {
      sendError(
        res,
        `Access denied. Required: ${allowedRoles.join(' or ')}. Your role: ${userRole}.`,
        403
      );
      return;
    }

    next();
  };
}

/**
 * Returns middleware allowing access if user's role is AT LEAST minRole.
 * Uses role hierarchy: VIEWER < ANALYST < ADMIN
 */
export function requireMinRole(minRole: Role) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Authentication required.', 401);
      return;
    }

    const userLevel = ROLE_HIERARCHY.indexOf(req.user.role as Role);
    const requiredLevel = ROLE_HIERARCHY.indexOf(minRole);

    if (userLevel < requiredLevel) {
      sendError(
        res,
        `Access denied. Minimum required role: ${minRole}. Your role: ${req.user.role}.`,
        403
      );
      return;
    }

    next();
  };
}

// ─── Convenience guards ────────────────────────────────────────────────────────
export const adminOnly = requireRole(ROLE.ADMIN);
export const analystOrAdmin = requireRole(ROLE.ANALYST, ROLE.ADMIN);
export const anyRole = requireRole(ROLE.VIEWER, ROLE.ANALYST, ROLE.ADMIN);

/** Utility — check role without middleware context */
export function hasMinRole(userRole: Role, minRole: Role): boolean {
  return ROLE_HIERARCHY.indexOf(userRole) >= ROLE_HIERARCHY.indexOf(minRole);
}
