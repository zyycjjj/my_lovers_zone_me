import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Subject } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';

export type ActivityEvent = {
  type: 'button_used';
  key: string;
  userId: number;
  occurredAt: string;
};

const loveKeyText: Record<string, string> = {
  hug: '给你抱抱',
  miss: '想你了',
  ok: '我很好',
  busy: '忙但想你',
};

@Injectable()
export class EventService {
  private readonly activitySubject = new Subject<ActivityEvent>();

  constructor(private readonly prisma: PrismaService) {}

  emitActivity(event: ActivityEvent) {
    this.activitySubject.next(event);
  }

  activityStream() {
    return this.activitySubject.asObservable();
  }

  async recordEvent(
    userId: number,
    type: 'tool_used' | 'signal_sent' | 'button_used',
    toolKey: string,
    date: string,
    targetToken?: string,
  ) {
    const key = type === 'signal_sent' ? '' : toolKey;
    try {
      await this.prisma.event.upsert({
        where: {
          userId_type_toolKey_date: {
            userId,
            type,
            toolKey: key,
            date,
          },
        },
        create: {
          userId,
          type,
          toolKey: key,
          date,
          count: 1,
        },
        update: {
          count: { increment: 1 },
        },
      });

      if (type === 'button_used') {
        const parts = key.split('.');
        const prefixRole = parts.length > 1 ? parts[0] : null;
        const action = parts.length > 1 ? parts[1] : key;
        const sender = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { role: true },
        });
        const senderRole = sender?.role ?? prefixRole;
        const text = loveKeyText[action];
        if (!text) return;

        let recipients: { id: number }[] = [];
        if (targetToken) {
          const recipient = await this.prisma.user.findUnique({
            where: { token: targetToken },
            select: { id: true },
          });
          if (recipient) {
            recipients = [recipient];
          }
        }

        if (!recipients.length) {
          const recipientRole =
            senderRole === 'me'
              ? 'girlfriend'
              : senderRole === 'girlfriend'
                ? 'me'
                : null;
          if (recipientRole) {
            recipients = await this.prisma.user.findMany({
              where: { role: recipientRole, NOT: { id: userId } },
              select: { id: true },
            });
          }
        }

        if (!recipients.length) {
          recipients = await this.prisma.user.findMany({
            where: { role: { in: ['me', 'girlfriend'] }, NOT: { id: userId } },
            select: { id: true },
          });
        }

        if (!recipients.length) {
          recipients = await this.prisma.user.findMany({
            where: { NOT: { id: userId } },
            orderBy: { createdAt: 'desc' },
            take: 3,
            select: { id: true },
          });
        }

        if (recipients.length) {
          await this.prisma.echo.createMany({
            data: recipients.map((recipient) => ({
              userId: recipient.id,
              text,
            })),
          });
        }
      }
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        await this.prisma.event.update({
          where: {
            userId_type_toolKey_date: {
              userId,
              type,
              toolKey: key,
              date,
            },
          },
          data: {
            count: { increment: 1 },
          },
        });
        return;
      }
      throw error;
    }
  }

  async incrementToolUsed(userId: number, toolKey: string, date: string) {
    await this.recordEvent(userId, 'tool_used', toolKey, date);
  }

  async incrementSignalSent(userId: number, date: string) {
    await this.recordEvent(userId, 'signal_sent', '', date);
  }
}
