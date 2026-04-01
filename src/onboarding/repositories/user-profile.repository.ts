import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DbClient } from '../../auth/repositories/repository.types';
import { pickDbClient } from '../../auth/repositories/auth.repository-helpers';

@Injectable()
export class UserProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByAccountId(accountId: number, tx?: DbClient) {
    return pickDbClient(this.prisma, tx).userProfile.findUnique({
      where: { accountId },
    });
  }

  upsertByAccountId(
    payload: {
      accountId: number;
      workspaceId: number;
      nickname: string;
      industry?: string;
      contentDirection?: string;
      targetPlatform?: string;
      experienceLevel?: string;
      onboardingCompletedAt: Date;
    },
    tx?: DbClient,
  ) {
    const db = pickDbClient(this.prisma, tx);
    return db.userProfile.upsert({
      where: { accountId: payload.accountId },
      create: payload,
      update: payload,
    });
  }
}
