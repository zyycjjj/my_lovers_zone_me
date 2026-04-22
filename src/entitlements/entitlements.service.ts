import { ForbiddenException, Injectable } from '@nestjs/common';
import { getDateKey } from '../common/date';
import { PlansService, type PlanKey } from '../plans/plans.service';
import { PrismaService } from '../prisma/prisma.service';

type LimitWindow = 'daily' | 'total';

const BILLABLE_TOOL_KEYS = ['title', 'script', 'refine'];

@Injectable()
export class EntitlementsService {
  constructor(
    private readonly plans: PlansService,
    private readonly prisma: PrismaService,
  ) {}

  private get db() {
    return this.prisma as unknown as {
      subscription: any;
      event: any;
    };
  }

  isBillableTool(toolKey: string) {
    return BILLABLE_TOOL_KEYS.includes(toolKey);
  }

  async getActiveSubscription(accountId?: number) {
    if (!accountId) return null;
    return this.db.subscription.findFirst({
      where: {
        accountId,
        status: 'active',
        OR: [{ expiredAt: null }, { expiredAt: { gt: new Date() } }],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async countUsage(input: {
    userId: number;
    window: LimitWindow;
    date: string;
  }) {
    const result = await this.db.event.aggregate({
      where: {
        userId: input.userId,
        type: 'tool_used',
        toolKey: { in: BILLABLE_TOOL_KEYS },
        ...(input.window === 'daily' ? { date: input.date } : {}),
      },
      _sum: { count: true },
    });

    return Number(result?._sum?.count || 0);
  }

  async getStatus(input: { userId: number; accountId?: number }) {
    const date = getDateKey();
    const subscription = await this.getActiveSubscription(input.accountId);

    if (!subscription) {
      return {
        active: false,
        planKey: null,
        planLabel: '未开通',
        limitWindow: 'daily' as LimitWindow,
        limit: 0,
        used: 0,
        remaining: 0,
        date,
        resetHint: '开通套餐后立即生效',
        subscription: null,
      };
    }

    const planKey = subscription.planKey as PlanKey;
    const plan = await this.plans.getPlan(planKey);
    if (!plan) {
      return {
        active: false,
        planKey,
        planLabel: '套餐已停用',
        limitWindow: 'daily' as LimitWindow,
        limit: 0,
        used: 0,
        remaining: 0,
        date,
        resetHint: '请联系管理员处理套餐配置',
        subscription,
      };
    }
    const used = await this.countUsage({
      userId: input.userId,
      window: plan.quotaWindow,
      date,
    });
    const remaining = Math.max(plan.quotaLimit - used, 0);

    return {
      active: true,
      planKey,
      planLabel: plan.name,
      limitWindow: plan.quotaWindow,
      limit: plan.quotaLimit,
      used,
      remaining,
      date,
      resetHint: plan.quotaWindow === 'daily' ? '明天恢复额度' : '体验额度用完后可升级套餐',
      subscription,
    };
  }

  async assertCanUseTool(input: {
    userId: number;
    accountId?: number;
    toolKey: string;
  }) {
    if (!this.isBillableTool(input.toolKey)) return null;

    const status = await this.getStatus(input);
    if (!status.active) {
      throw new ForbiddenException('当前还没有开通套餐，请先解锁后继续生成。');
    }
    if (status.remaining <= 0) {
      throw new ForbiddenException(
        status.limitWindow === 'daily'
          ? '今日生成额度已用完，明天会自动恢复，也可以升级套餐。'
          : '体验额度已用完，请升级套餐后继续生成。',
      );
    }

    return status;
  }
}
