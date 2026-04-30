import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { getDateKey } from '../common/date';
import { PaymentsService } from '../payments/payments.service';
import { PlansService } from '../plans/plans.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly payments: PaymentsService,
    private readonly plans: PlansService,
  ) {}

  async summary() {
    const date = getDateKey();
    try {
      const [events, latestSignal, echoes, photos] = await Promise.all([
        this.prisma.event.findMany({
          where: { date },
          orderBy: { updatedAt: 'desc' },
        }),
        this.prisma.signal.findFirst({
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.echo.findMany({
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
        this.prisma.photo.findMany({
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
      ]);

      return {
        date,
        events,
        latestSignal,
        echoes,
        photos,
      };
    } catch (error) {
      // 避免后台汇总接口直接 500，先记录错误并返回空数据，方便线上使用
      // eslint-disable-next-line no-console
      console.error('Admin summary error', error);
      return {
        date,
        events: [],
        latestSignal: null,
        echoes: [],
        photos: [],
      };
    }
  }

  async photos(limit = 20) {
    return this.prisma.photo.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async users(limit = 50) {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async accounts(limit = 100) {
    const db = this.prisma as any;
    const accounts = await db.account.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        subscriptions: {
          where: { status: 'active' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
    return accounts.map((a: any) => ({
      id: a.id,
      phone: a.phone,
      displayName: a.displayName,
      avatarUrl: a.avatarUrl,
      status: a.status,
      createdAt: a.createdAt,
      subscription: a.subscriptions?.[0] ?? null,
    }));
  }

  async manualActivate(input: {
    accountId: number;
    planKey: string;
    note?: string;
  }) {
    const db = this.prisma as any;
    const account = await db.account.findUnique({ where: { id: input.accountId } });
    if (!account) throw new NotFoundException('Account not found');

    const plan = await this.plans.getPlan(input.planKey as any);
    if (!plan) throw new BadRequestException('Plan is disabled or invalid');

    // 查找该 account 关联的 user，用作订单的 userId
    const user = await db.user.findFirst();
    const userId = user?.id ?? 1;

    // 1. 虚拟一个订单
    const order = await db.paymentOrder.create({
      data: {
        orderNo: `MO${Date.now()}${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`.slice(0, 32),
        userId,
        accountId: input.accountId,
        planKey: input.planKey,
        amountFen: plan.priceFen,
        status: 'paid',
        paidAt: new Date(),
        adminNote: `[手动开通] ${input.note || ''}`.trim(),
      },
    });

    // 2. 复用 approveOrder 流程
    return this.payments.approveOrder(order.id, `[手动开通] ${input.note || ''}`.trim());
  }

  async events(limit = 100) {
    return this.prisma.event.findMany({
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });
  }

  async seedUsers(payload: {
    meName?: string;
    girlfriendName?: string;
    testName?: string;
  }) {
    const toToken = () => randomBytes(12).toString('hex');

    const ensureRole = async (
      role: 'me' | 'girlfriend' | 'test',
      name: string,
    ) => {
      const existing = await this.prisma.user.findFirst({ where: { role } });
      if (existing) {
        return this.prisma.user.update({
          where: { id: existing.id },
          data: {
            name,
            token: toToken(),
          },
        });
      }
      return this.prisma.user.create({
        data: {
          token: toToken(),
          role,
          name,
        },
      });
    };

    const [me, girlfriend, test] = await Promise.all([
      ensureRole('me', payload.meName ?? '我'),
      ensureRole('girlfriend', payload.girlfriendName ?? '她'),
      ensureRole('test', payload.testName ?? '测试'),
    ]);

    return { me, girlfriend, test };
  }

  async paymentOrders(limit = 100) {
    return this.payments.listAllOrders(limit);
  }

  async approvePaymentOrder(orderId: number, note?: string) {
    return this.payments.approveOrder(orderId, note);
  }

  async rejectPaymentOrder(orderId: number, note?: string) {
    return this.payments.rejectOrder(orderId, note);
  }

  async paymentConfig() {
    return this.payments.getPublicPaymentConfig();
  }

  async savePaymentConfig(input: {
    unifiedLink?: string;
    alipayLink?: string;
    wechatLink?: string;
    alipayQrImage?: string;
    wechatQrImage?: string;
    contactText?: string;
  }) {
    return this.payments.savePaymentConfig(input);
  }

  async planConfig() {
    return this.payments.getAdminPlanConfig();
  }

  async savePlanConfig(input: { plans?: unknown }) {
    return this.payments.savePlanConfig(input);
  }
}
