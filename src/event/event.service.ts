import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EventService {
  constructor(private readonly prisma: PrismaService) {}

  async incrementToolUsed(userId: number, toolKey: string, date: string) {
    await this.prisma.event.upsert({
      where: {
        userId_type_toolKey_date: {
          userId,
          type: 'tool_used',
          toolKey,
          date,
        },
      },
      create: {
        userId,
        type: 'tool_used',
        toolKey,
        date,
        count: 1,
      },
      update: {
        count: { increment: 1 },
      },
    });
  }

  async incrementSignalSent(userId: number, date: string) {
    await this.prisma.event.upsert({
      where: {
        userId_type_toolKey_date: {
          userId,
          type: 'signal_sent',
          toolKey: '',
          date,
        },
      },
      create: {
        userId,
        type: 'signal_sent',
        toolKey: '',
        date,
        count: 1,
      },
      update: {
        count: { increment: 1 },
      },
    });
  }
}
