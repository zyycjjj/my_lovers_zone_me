import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
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
    const toToken = (role: string) =>
      `love_${role}_${randomBytes(6).toString('hex')}`;

    const ensureRole = async (
      role: 'me' | 'girlfriend' | 'test',
      name: string,
    ) => {
      const existing = await this.prisma.user.findFirst({ where: { role } });
      if (existing) {
        return this.prisma.user.update({
          where: { id: existing.id },
          data: { name },
        });
      }
      return this.prisma.user.create({
        data: {
          token: toToken(role),
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
}
