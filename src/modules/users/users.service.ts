import bcrypt from 'bcryptjs';
import type { Request } from 'express';

import { prisma } from '../../lib/prisma';
import { getPagination, buildPaginationMeta } from '../../utils/pagination';
import { AUDIT_ACTION, STATUS } from '../../constants';

import type { CreateUserInput, UpdateRoleInput, UpdateStatusInput } from './users.schema';

/**
 * Users Service — all user management business logic.
 */
export class UsersService {
  /** List all non-deleted users with pagination */
  static async list(req: Request) {
    const { page, limit, skip } = getPagination(req);

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: { isDeleted: false },
        skip,
        take: limit,
        select: { id: true, email: true, name: true, role: true, status: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where: { isDeleted: false } }),
    ]);

    return { users, meta: buildPaginationMeta(page, limit, total) };
  }

  /** Get single user by ID */
  static async getById(id: string) {
    return prisma.user.findUniqueOrThrow({
      where: { id, isDeleted: false },
      select: { id: true, email: true, name: true, role: true, status: true, createdAt: true, updatedAt: true },
    });
  }

  /** Create a new user (admin version — can assign role) */
  static async create(data: CreateUserInput, actorId: string) {
    const hashedPassword = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        role: data.role ?? 'VIEWER',
        status: STATUS.ACTIVE,
      },
      select: { id: true, email: true, name: true, role: true, status: true, createdAt: true },
    });

    await prisma.auditLog.create({
      data: {
        userId: actorId,
        action: AUDIT_ACTION.CREATE_USER,
        entity: 'User',
        entityId: user.id,
        after: JSON.stringify({ email: user.email, role: user.role }),
      },
    });

    return user;
  }

  /** Update a user's role */
  static async updateRole(id: string, data: UpdateRoleInput, actorId: string) {
    const existing = await prisma.user.findUniqueOrThrow({ where: { id, isDeleted: false } });

    const user = await prisma.user.update({
      where: { id },
      data: { role: data.role },
      select: { id: true, email: true, role: true },
    });

    await prisma.auditLog.create({
      data: {
        userId: actorId,
        action: AUDIT_ACTION.UPDATE_USER_ROLE,
        entity: 'User',
        entityId: id,
        before: JSON.stringify({ role: existing.role }),
        after: JSON.stringify({ role: data.role }),
      },
    });

    return user;
  }

  /** Update a user's status (ACTIVE/INACTIVE/SUSPENDED) */
  static async updateStatus(id: string, data: UpdateStatusInput, actorId: string) {
    const existing = await prisma.user.findUniqueOrThrow({ where: { id, isDeleted: false } });

    const user = await prisma.user.update({
      where: { id },
      data: { status: data.status },
      select: { id: true, email: true, status: true },
    });

    await prisma.auditLog.create({
      data: {
        userId: actorId,
        action: AUDIT_ACTION.UPDATE_USER_STATUS,
        entity: 'User',
        entityId: id,
        before: JSON.stringify({ status: existing.status }),
        after: JSON.stringify({ status: data.status }),
      },
    });

    return user;
  }

  /** Soft-delete a user */
  static async delete(id: string, actorId: string) {
    if (actorId === id) {
      throw Object.assign(new Error('You cannot delete your own account'), { status: 400 });
    }

    await prisma.user.findUniqueOrThrow({ where: { id, isDeleted: false } });

    await prisma.user.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        status: STATUS.INACTIVE,
        // Anonymise email to allow re-registration
        email: `deleted_${id}@deleted.invalid`,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: actorId,
        action: AUDIT_ACTION.DELETE_USER,
        entity: 'User',
        entityId: id,
      },
    });
  }
}
