import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EchoDto } from './dto/echo.dto';

@Injectable()
export class EchoService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number, payload: EchoDto) {
    return this.prisma.echo.create({
      data: {
        userId,
        text: payload.text,
      },
    });
  }

  async createByToken(token: string, payload: EchoDto) {
    const user = await this.prisma.user.upsert({
      where: { token },
      create: { token },
      update: {},
      select: { id: true },
    });
    return this.create(user.id, payload);
  }

  async latest(userId: number) {
    return this.prisma.echo.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
  }
}
