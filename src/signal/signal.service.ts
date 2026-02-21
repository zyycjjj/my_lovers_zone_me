import { Injectable } from '@nestjs/common';
import { getDateKey } from '../common/date';
import { EventService } from '../event/event.service';
import { PrismaService } from '../prisma/prisma.service';
import { SignalDto } from './dto/signal.dto';

@Injectable()
export class SignalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventService,
  ) {}

  async submit(userId: number, payload: SignalDto) {
    const date = getDateKey();
    const signal = await this.prisma.signal.upsert({
      where: { userId_date: { userId, date } },
      create: {
        userId,
        date,
        mood: payload.mood,
        status: payload.status,
        message: payload.message,
      },
      update: {
        mood: payload.mood,
        status: payload.status,
        message: payload.message,
      },
    });

    await this.events.incrementSignalSent(userId, date);
    return signal;
  }

  async getToday(userId: number) {
    const date = getDateKey();
    return this.prisma.signal.findUnique({
      where: { userId_date: { userId, date } },
    });
  }
}
