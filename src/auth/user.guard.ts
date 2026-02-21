import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<Request>();
    const token = req.userToken;
    if (!token) {
      throw new BadRequestException('Missing user token');
    }

    const user = await this.prisma.user.upsert({
      where: { token },
      create: { token },
      update: {},
      select: { id: true },
    });

    req.userId = user.id;
    return true;
  }
}
