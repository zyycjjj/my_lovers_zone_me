import { Injectable } from '@nestjs/common';
import { getDateKey } from '../common/date';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

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
}
