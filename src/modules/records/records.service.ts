import { prisma } from '../../lib/prisma';
import { getPagination, buildPaginationMeta } from '../../utils/pagination';
import { AUDIT_ACTION } from '../../constants';
import type { Request } from 'express';
import type { CreateRecordInput, UpdateRecordInput, RecordQueryInput } from './records.schema';

/**
 * Records Service — all business logic for financial records.
 */
export class RecordsService {
  /** List records with filtering and pagination */
  static async list(query: RecordQueryInput, req: Request) {
    const { type, category, startDate, endDate } = query;
    const { page, limit, skip } = getPagination(req);

    const where: Record<string, unknown> = { isDeleted: false };
    if (type) where['type'] = type;
    if (category) where['category'] = category;
    if (startDate ?? endDate) {
      where['date'] = {
        ...(startDate && { gte: startDate }),
        ...(endDate && { lte: endDate }),
      };
    }

    const [records, total] = await Promise.all([
      prisma.financialRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: {
          creator: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.financialRecord.count({ where }),
    ]);

    return { records, meta: buildPaginationMeta(page, limit, total) };
  }

  /** Get a single record by ID */
  static async getById(id: string) {
    return prisma.financialRecord.findUniqueOrThrow({
      where: { id, isDeleted: false },
      include: {
        creator: { select: { id: true, name: true, email: true } },
      },
    });
  }

  /** Create a new financial record */
  static async create(data: CreateRecordInput, userId: string, ip?: string) {
    const record = await prisma.financialRecord.create({
      data: { ...data, createdBy: userId, notes: data.notes ?? null },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: AUDIT_ACTION.CREATE_RECORD,
        entity: 'FinancialRecord',
        entityId: record.id,
        after: JSON.stringify(data),
        ipAddress: ip ?? null,
      },
    });

    return record;
  }

  /** Update a financial record */
  static async update(id: string, data: UpdateRecordInput, userId: string) {
    const existing = await prisma.financialRecord.findUniqueOrThrow({
      where: { id, isDeleted: false },
    });

    const updateData: Record<string, unknown> = {};
    if (data.type !== undefined) updateData.type = data.type;
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.date !== undefined) updateData.date = data.date;
    if (data.notes !== undefined) updateData.notes = data.notes ?? null;

    const record = await prisma.financialRecord.update({
      where: { id },
      data: updateData,
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: AUDIT_ACTION.UPDATE_RECORD,
        entity: 'FinancialRecord',
        entityId: id,
        before: JSON.stringify(existing),
        after: JSON.stringify(data),
      },
    });

    return record;
  }

  /** Soft-delete a financial record */
  static async delete(id: string, userId: string) {
    // Verify it exists and is not already deleted
    await prisma.financialRecord.findUniqueOrThrow({
      where: { id, isDeleted: false },
    });

    await prisma.financialRecord.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: AUDIT_ACTION.DELETE_RECORD,
        entity: 'FinancialRecord',
        entityId: id,
      },
    });
  }
}
