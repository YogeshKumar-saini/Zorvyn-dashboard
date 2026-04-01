import { prisma } from '../../lib/prisma';
import { RECORD_TYPE } from '../../constants';

/**
 * Dashboard Service — all analytics queries.
 * Uses DB-level aggregation — never loads all rows into JS memory.
 */
export class DashboardService {
  /**
   * Get summary: total income, total expenses, net balance.
   * Uses Prisma groupBy + _sum to aggregate in the DB — O(1) memory.
   */
  static async getSummary() {
    const grouped = await prisma.financialRecord.groupBy({
      by: ['type'],
      where: { isDeleted: false },
      _sum: { amount: true },
    });

    let totalIncome = 0;
    let totalExpenses = 0;

    for (const row of grouped) {
      if (row.type === RECORD_TYPE.INCOME) {
        totalIncome = row._sum.amount ?? 0;
      } else {
        totalExpenses = row._sum.amount ?? 0;
      }
    }

    return {
      totalIncome,
      totalExpenses,
      netBalance: totalIncome - totalExpenses,
      currency: 'USD',
    };
  }

  /** Get totals grouped by category and type — fully DB-aggregated */
  static async getByCategory() {
    return prisma.financialRecord.groupBy({
      by: ['category', 'type'],
      where: { isDeleted: false },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
    });
  }

  /**
   * Get monthly trends for the last N months.
   * Fetches only date + amount + type for the window, aggregates in JS.
   * Bounded query — not a full-table scan.
   */
  static async getTrends(months = 6) {
    const since = new Date();
    since.setMonth(since.getMonth() - months);

    const records = await prisma.financialRecord.findMany({
      where: { isDeleted: false, date: { gte: since } },
      select: { amount: true, type: true, date: true },
      orderBy: { date: 'asc' },
    });

    const trendMap = new Map<string, { income: number; expense: number }>();

    for (const r of records) {
      // YYYY-MM key for stable month grouping (locale-independent)
      const key = `${r.date.getFullYear()}-${String(r.date.getMonth() + 1).padStart(2, '0')}`;
      if (!trendMap.has(key)) trendMap.set(key, { income: 0, expense: 0 });
      const entry = trendMap.get(key)!;
      if (r.type === RECORD_TYPE.INCOME) entry.income += r.amount;
      else entry.expense += r.amount;
    }

    return Array.from(trendMap.entries()).map(([month, data]) => ({ month, ...data }));
  }

  /** Get recent activity — last N transactions */
  static async getRecentActivity(limit = 10) {
    return prisma.financialRecord.findMany({
      where: { isDeleted: false },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        creator: { select: { id: true, name: true } },
      },
    });
  }

  /** Get total record count and type breakdown */
  static async getStats() {
    const [total, typeBreakdown, recentCount] = await Promise.all([
      prisma.financialRecord.count({ where: { isDeleted: false } }),
      prisma.financialRecord.groupBy({
        by: ['type'],
        where: { isDeleted: false },
        _count: true,
      }),
      prisma.financialRecord.count({
        where: {
          isDeleted: false,
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    return { total, typeBreakdown, recentCount };
  }
}
