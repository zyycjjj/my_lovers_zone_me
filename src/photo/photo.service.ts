import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PhotoService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number, url: string, signalId?: number) {
    return this.prisma.photo.create({
      data: {
        userId,
        url,
        signalId: signalId ?? null,
      },
    });
  }

  async latest(userId: number, take = 20) {
    return this.prisma.photo.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take,
    });
  }
}
