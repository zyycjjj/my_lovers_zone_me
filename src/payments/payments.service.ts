import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const PLAN_PRICE_FEN: Record<'experience' | 'pro' | 'team', number> = {
  experience: 100,
  pro: 9900,
  team: 29900,
};

function buildOrderNo() {
  const now = Date.now().toString();
  const rand = Math.floor(Math.random() * 1000000)
    .toString()
    .padStart(6, '0');
  return `PO${now}${rand}`.slice(0, 32);
}

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrder(input: {
    userId: number;
    accountId?: number;
    planKey: 'experience' | 'pro' | 'team';
  }) {
    const amountFen = PLAN_PRICE_FEN[input.planKey];
    if (!amountFen) throw new BadRequestException('Invalid plan key');

    return this.prisma.paymentOrder.create({
      data: {
        orderNo: buildOrderNo(),
        userId: input.userId,
        accountId: input.accountId,
        planKey: input.planKey,
        amountFen,
      },
    });
  }

  async listMyOrders(input: { userId: number; accountId?: number }) {
    return this.prisma.paymentOrder.findMany({
      where: {
        OR: [
          { userId: input.userId },
          ...(input.accountId ? [{ accountId: input.accountId }] : []),
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async submitProof(input: {
    orderId: number;
    userId: number;
    accountId?: number;
    paymentRef?: string;
    note?: string;
  }) {
    const order = await this.prisma.paymentOrder.findUnique({
      where: { id: input.orderId },
    });
    if (!order) throw new NotFoundException('Order not found');

    const isOwner =
      order.userId === input.userId ||
      (input.accountId != null && order.accountId === input.accountId);
    if (!isOwner) throw new ForbiddenException('No permission');

    if (order.status === 'activated' || order.status === 'refunded') {
      throw new BadRequestException('Order cannot be updated');
    }

    return this.prisma.paymentOrder.update({
      where: { id: order.id },
      data: {
        status: 'paid',
        paymentRef: input.paymentRef?.trim() || order.paymentRef,
        proofNote: input.note?.trim() || order.proofNote,
        paidAt: new Date(),
      },
    });
  }

  async listAllOrders(limit = 100) {
    return this.prisma.paymentOrder.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async approveOrder(orderId: number, note?: string) {
    const order = await this.prisma.paymentOrder.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status === 'activated') return order;
    if (!order.accountId) {
      throw new BadRequestException('Order has no account, cannot activate');
    }

    const now = new Date();
    const expiredAt = new Date(now.getTime());
    const plusDays = order.planKey === 'experience' ? 7 : 30;
    expiredAt.setDate(expiredAt.getDate() + plusDays);

    const result = await this.prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.paymentOrder.update({
        where: { id: orderId },
        data: {
          status: 'activated',
          activatedAt: now,
          adminNote: note?.trim() || undefined,
        },
      });

      const subscription = await tx.subscription.create({
        data: {
          accountId: order.accountId!,
          planKey: order.planKey,
          status: 'active',
          startedAt: now,
          expiredAt,
          orderId: updatedOrder.id,
        },
      });

      return { order: updatedOrder, subscription };
    });

    return result;
  }

  async rejectOrder(orderId: number, note?: string) {
    const order = await this.prisma.paymentOrder.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new NotFoundException('Order not found');

    return this.prisma.paymentOrder.update({
      where: { id: orderId },
      data: {
        status: 'rejected',
        adminNote: note?.trim() || undefined,
      },
    });
  }
}
