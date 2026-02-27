import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';

export type ActivityEvent = {
  type: 'button_used';
  key: string;
  userId: number;
  occurredAt: string;
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
  ) {
    const key = type === 'signal_sent' ? '' : toolKey;
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
  }

  async incrementToolUsed(userId: number, toolKey: string, date: string) {
    await this.recordEvent(userId, 'tool_used', toolKey, date);
  }

  async incrementSignalSent(userId: number, date: string) {
    await this.recordEvent(userId, 'signal_sent', '', date);
  }
}
