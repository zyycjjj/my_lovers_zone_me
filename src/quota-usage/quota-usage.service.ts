import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { getDateKey } from '../common/date';
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

    const today = getDateKey();
    const weekAgoDate = new Date();
    weekAgoDate.setDate(weekAgoDate.getDate() - 7);
    const weekAgo = getDateKey(weekAgoDate);

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

  async getDetailedUsage(input: { userId: number; days: number }) {
    const since = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000);
    const items = await this.prisma.quotaUsage.findMany({
      where: { userId: input.userId, createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    const total = await this.prisma.quotaUsage.count({
      where: { userId: input.userId, createdAt: { gte: since } },
    });
    return {
      items: items.map((it) => ({
        id: it.id,
        quotaKey: it.quotaKey,
        amount: it.amount,
        description: it.description || '-',
        refType: it.refType,
        refId: it.refId,
        balanceAfter: it.balanceAfter,
        createdAt: it.createdAt,
      })),
      total,
      days: input.days,
    };
  }

  async grantQuota(input: {
    operatorId: number;
    accountId: number;
    amount: number;
    reason?: string;
  }) {
    if (input.amount <= 0) {
      throw new BadRequestException('amount 必须大于 0');
    }

    const account = await this.prisma.account.findUnique({
      where: { id: input.accountId },
      select: { id: true, displayName: true, phone: true },
    });
    if (!account) throw new NotFoundException('账号不存在');

    const user = await this.prisma.user.findFirst({
      where: { token: `account:${input.accountId}` },
      select: { id: true },
    });
    if (!user) throw new NotFoundException('用户记录不存在');

    await this.prisma.quotaUsage.create({
      data: {
        userId: user.id,
        accountId: input.accountId,
        planKey: 'admin_grant',
        quotaKey: 'bonus',
        amount: input.amount,
        description:
          input.reason || `管理员补发额度 +${input.amount}`,
        refType: 'admin_grant',
        balanceAfter: null,
      },
    });

    return {
      ok: true,
      message: `已为 ${account.displayName || account.phone} 补发 ${input.amount} 点额度`,
      accountId: input.accountId,
      amount: input.amount,
    };
  }

  async resetQuota(input: {
    operatorId: number;
    accountId: number;
    newLimit?: number;
    resetUsed?: boolean;
  }) {
    const account = await this.prisma.account.findUnique({
      where: { id: input.accountId },
      select: { id: true, displayName: true, phone: true },
    });
    if (!account) throw new NotFoundException('账号不存在');

    const results: Record<string, unknown> = { accountId: input.accountId };

    if (input.resetUsed) {
      const user = await this.prisma.user.findFirst({
        where: { token: `account:${input.accountId}` },
        select: { id: true },
      });

      if (user) {
        const today = getDateKey();
        const deleted = await this.prisma.event.deleteMany({
          where: {
            userId: user.id,
            type: 'tool_used',
            date: { gte: today },
          },
        });
        results.clearedEvents = deleted.count;
      }
    }

    if (input.newLimit !== undefined && input.newLimit >= 0) {
      results.newLimit = input.newLimit;
    }

    return {
      ok: true,
      message: `已处理 ${account.displayName || account.phone} 的额度重置`,
      ...results,
    };
  }
}
