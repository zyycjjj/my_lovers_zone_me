import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { getDateKey } from '../common/date';
import { PaymentsService } from '../payments/payments.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly payments: PaymentsService,
  ) {}

  async summary() {
    const date = getDateKey();
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
}
