import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class QuotaUsageService {
  constructor(private readonly prisma: PrismaService) {}

  async record(input: {
    userId: number;
    accountId?: number;
    planKey: string;
    quotaKey: string;
    amount?: number;
    description?: string;
    refType?: string;
    refId?: number;
    balanceAfter?: number;
  }) {
    return this.prisma.quotaUsage.create({
      data: {
        userId: input.userId,
        accountId: input.accountId,
        planKey: input.planKey,
        quotaKey: input.quotaKey,
        amount: input.amount ?? 1,
        description: input.description,
        refType: input.refType,
        refId: input.refId,
        balanceAfter: input.balanceAfter,
      },
    });
  }

  async listMine(input: {
    userId: number;
    accountId?: number;
    quotaKey?: string;
    limit?: number;
    offset?: number;
    startDate?: string;
    endDate?: string;
  }) {
    const take = Math.min(Math.max(input.limit ?? 20, 1), 100);
    const skip = Math.max(input.offset ?? 0, 0);
    const where: Record<string, unknown> = { userId: input.userId };

    if (input.accountId) where.accountId = input.accountId;
    if (input.quotaKey) where.quotaKey = input.quotaKey;

    if (input.startDate || input.endDate) {
      where.createdAt = {};
      if (input.startDate) {
        (where.createdAt as Record<string, unknown>).gte = new Date(`${input.startDate}T00:00:00.000Z`);
      }
      if (input.endDate) {
        (where.createdAt as Record<string, unknown>).lte = new Date(`${input.endDate}T23:59:59.999Z`);
      }
    }

    const [items, total] = await Promise.all([
      this.prisma.quotaUsage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
      this.prisma.quotaUsage.count({ where }),
    ]);

    return { items, total, limit: take, offset: skip };
  }

  async getSummary(input: { userId: number; accountId?: number }) {
    const baseWhere: Record<string, any> = { userId: input.userId };
    if (input.accountId) baseWhere.accountId = input.accountId;

    const today = new Date().toISOString().slice(0, 10);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const [todayTotal, weekTotal, allTotal, byQuotaKey] = await Promise.all([
      this.prisma.quotaUsage.aggregate({
        where: {
          ...baseWhere,
          createdAt: { gte: new Date(`${today}T00:00:00.000Z`) },
        },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.quotaUsage.aggregate({
        where: {
          ...baseWhere,
          createdAt: { gte: new Date(`${weekAgo}T00:00:00.000Z`) },
        },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.quotaUsage.aggregate({
        where: baseWhere,
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.quotaUsage.groupBy({
        by: ['quotaKey'],
        where: baseWhere,
        _sum: { amount: true },
        orderBy: { _sum: { amount: 'desc' } },
      }),
    ]);

    return {
      todayUsed: todayTotal._sum.amount ?? 0,
      todayCount: todayTotal._count,
      weekUsed: weekTotal._sum.amount ?? 0,
      weekCount: weekTotal._count,
      totalUsed: allTotal._sum.amount ?? 0,
      totalCount: allTotal._count,
      breakdown: byQuotaKey.map((item) => ({
        quotaKey: item.quotaKey,
        used: item._sum.amount ?? 0,
      })),
    };
  }
}
