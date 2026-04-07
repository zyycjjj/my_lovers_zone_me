import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UserGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<Request>();
    const legacyToken = req.userToken;

    if (legacyToken) {
      const user = await this.prisma.user.upsert({
        where: { token: legacyToken },
        create: { token: legacyToken },
        update: {},
        select: { id: true },
      });

      req.userId = user.id;
      return true;
    }

    const sessionToken =
      req.header('x-session-token')?.trim() ||
      (typeof req.cookies?.['session_token'] === 'string'
        ? req.cookies['session_token'].trim()
        : undefined);

    if (!sessionToken) {
      throw new BadRequestException('Missing user token');
    }

    const session = await this.prisma.authSession.findUnique({
      where: { sessionToken },
      select: { id: true, accountId: true, expiredAt: true },
    });

    if (!session) {
      throw new UnauthorizedException('Session not found');
    }

    if (session.expiredAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('Session expired');
    }

    await this.prisma.authSession.update({
      where: { id: session.id },
      data: { lastActiveAt: new Date() },
    });

    const token = `account:${session.accountId}`;
    const user = await this.prisma.user.upsert({
      where: { token },
      create: { token },
      update: {},
      select: { id: true },
    });

    req.sessionToken = sessionToken;
    req.accountId = session.accountId;
    req.userId = user.id;
    return true;
  }
}
