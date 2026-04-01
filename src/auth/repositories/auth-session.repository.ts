import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DbClient } from './repository.types';
import { pickDbClient } from './auth.repository-helpers';

@Injectable()
export class AuthSessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  findBySessionToken(sessionToken: string, tx?: DbClient) {
    return pickDbClient(this.prisma, tx).authSession.findUnique({
      where: { sessionToken },
    });
  }

  findByRefreshToken(refreshToken: string, tx?: DbClient) {
    return pickDbClient(this.prisma, tx).authSession.findUnique({
      where: { refreshToken },
    });
  }

  create(
    payload: {
      accountId: number;
      sessionToken: string;
      refreshToken: string;
      expiredAt: Date;
      ip?: string;
      userAgent?: string;
    },
    tx?: DbClient,
  ) {
    return pickDbClient(this.prisma, tx).authSession.create({
      data: payload,
    });
  }

  updateTokens(
    id: number,
    payload: { sessionToken?: string; refreshToken?: string; expiredAt: Date },
    tx?: DbClient,
  ) {
    return pickDbClient(this.prisma, tx).authSession.update({
      where: { id },
      data: {
        ...payload,
        lastActiveAt: new Date(),
      },
    });
  }

  touch(id: number, tx?: DbClient) {
    return pickDbClient(this.prisma, tx).authSession.update({
      where: { id },
      data: { lastActiveAt: new Date() },
    });
  }

  deleteBySessionToken(sessionToken: string, tx?: DbClient) {
    return pickDbClient(this.prisma, tx).authSession.delete({
      where: { sessionToken },
    });
  }

  deleteByAccountId(accountId: number, tx?: DbClient) {
    return pickDbClient(this.prisma, tx).authSession.deleteMany({
      where: { accountId },
    });
  }
}
