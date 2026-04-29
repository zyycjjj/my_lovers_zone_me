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
    _targetToken?: string,
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
        const action = parts.length > 1 ? parts[1] : key;
        const sender = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { role: true },
        });
        const senderRole = sender?.role ?? (parts.length > 1 ? parts[0] : null);
        const text = loveKeyText[action];
        if (!text) return;

        let recipients: { id: number }[] = [];
        if (senderRole === 'me' && _targetToken) {
          const targetUser = await this.prisma.user.findUnique({
            where: { token: _targetToken },
            select: { id: true },
          });
          if (targetUser) {
            recipients = [targetUser];
          }
        }

        if (!recipients.length) {
          recipients = await this.prisma.user.findMany({
            where: { role: 'me' },
            select: { id: true },
          });
        }

        if (recipients.length > 0) {
          await this.prisma.echo.createMany({
            data: recipients.map((recipient) => ({
              userId: recipient.id,
              text,
            })),
          });
          return;
        }

        await this.prisma.echo.create({
          data: { userId, text },
        });
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

  // 新增：内容相关行为记录
  async recordContentAction(
    userId: number,
    action: 'saved' | 'completed' | 'copied' | 'continued' | 'deleted',
    toolKey?: string,
    date?: string,
  ) {
    const key = `content.${action}`;
    const d = date || new Date().toISOString().slice(0, 10);
    return this.recordEvent(userId, 'button_used', `${key}${toolKey ? `.${toolKey}` : ''}`, d);
  }

  // 新增：获取用户行为统计
  async getUserBehaviorStats(userId: number, days: number = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const dateStr = since.toISOString().slice(0, 10);

    const events = await this.prisma.event.findMany({
      where: {
        userId,
        date: { gte: dateStr },
      },
      orderBy: { date: 'desc' },
    });

    const toolUsage: Record<string, number> = {};
    const contentActions: Record<string, number> = { saved: 0, completed: 0, copied: 0, continued: 0, deleted: 0 };
    let totalActions = 0;

    for (const event of events) {
      totalActions += event.count;
      if (event.type === 'tool_used') {
        toolUsage[event.toolKey] = (toolUsage[event.toolKey] || 0) + event.count;
      }
      if (event.type === 'button_used' && event.toolKey.startsWith('content.')) {
        const action = event.toolKey.split('.')[1];
        if (action in contentActions) {
          contentActions[action] += event.count;
        }
      }
    }

    const activeDays = new Set(events.map((e) => e.date)).size;
    const lastActiveDate = events.length > 0 ? events[0].date : null;

    return {
      periodDays: days,
      activeDays,
      totalActions,
      lastActiveDate,
      toolUsage,
      contentActions,
      avgActionsPerDay: activeDays > 0 ? Math.round(totalActions / activeDays) : 0,
    };
  }

  // 新增：获取每日活跃趋势
  async getDailyTrend(userId: number, days: number = 7) {
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);

      const dayEvents = await this.prisma.event.findMany({
        where: { userId, date: dateStr },
      });

      const total = dayEvents.reduce((sum, e) => sum + e.count, 0);

      result.push({
        date: dateStr,
        totalActions: total,
        toolBreakdown: dayEvents
          .filter((e) => e.type === 'tool_used')
          .reduce((acc, e) => ({ ...acc, [e.toolKey]: ((acc as Record<string, number>)[e.toolKey] || 0) + e.count }), {} as Record<string, number>),
      });
    }

    return result;
  }
}
