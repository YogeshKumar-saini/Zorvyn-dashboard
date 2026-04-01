import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma';
import { env } from '../../config/env';
import { ROLE, STATUS, AUDIT_ACTION } from '../../constants';
import { blacklistToken } from '../../middleware/auth.middleware';
import type { RegisterInput, LoginInput } from './auth.schema';
import { randomUUID } from 'crypto';

/**
 * Auth Service — all business logic for authentication.
 * Controllers call this; no Prisma calls in controllers.
 */
export class AuthService {
  /** Register a new user with VIEWER role */
  static async register(data: RegisterInput) {
    const hashedPassword = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        role: ROLE.VIEWER,
        status: STATUS.ACTIVE,
      },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: AUDIT_ACTION.USER_REGISTER,
        entity: 'User',
        entityId: user.id,
        after: JSON.stringify({ email: user.email, role: user.role }),
      },
    });

    return user;
  }

  /** Validate credentials and return a signed JWT */
  static async login(data: LoginInput, ip?: string, userAgent?: string) {
    const user = await prisma.user.findUnique({
      where: { email: data.email, isDeleted: false },
    });

    if (!user) {
      throw Object.assign(new Error('Invalid email or password'), { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw Object.assign(new Error('Invalid email or password'), { status: 401 });
    }

    if (user.status === STATUS.INACTIVE) {
      throw Object.assign(new Error('Your account is inactive. Contact an administrator.'), { status: 403 });
    }

    if (user.status === STATUS.SUSPENDED) {
      throw Object.assign(new Error('Your account has been suspended. Contact an administrator.'), { status: 403 });
    }

    const jti = randomUUID();
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, jti },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN as Exclude<jwt.SignOptions['expiresIn'], undefined> }
    );

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: AUDIT_ACTION.USER_LOGIN,
        entity: 'User',
        entityId: user.id,
        ipAddress: ip ?? null,
        userAgent: userAgent ?? null,
      },
    });

    return {
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    };
  }

  /** Revoke the current token (logout) */
  static async logout(token: string, userId: string) {
    let jti: string | undefined;
    let exp: number | undefined;

    try {
      const decoded = jwt.decode(token) as { jti?: string; exp?: number } | null;
      jti = decoded?.jti;
      exp = decoded?.exp;
    } catch {
      // If decode fails, nothing to blacklist
    }

    if (jti && exp) {
      blacklistToken(jti, exp * 1000);
    }

    await prisma.auditLog.create({
      data: {
        userId,
        action: AUDIT_ACTION.USER_LOGOUT,
        entity: 'User',
        entityId: userId,
      },
    });
  }
}
