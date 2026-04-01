import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuthSessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  findBySessionToken(sessionToken: string) {
    return this.prisma.authSession.findUnique({ where: { sessionToken } });
  }

  findByRefreshToken(refreshToken: string) {
    return this.prisma.authSession.findUnique({ where: { refreshToken } });
  }
}
