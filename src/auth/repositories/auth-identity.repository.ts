import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthProvider } from '@prisma/client';
import { DbClient } from './repository.types';
import { pickDbClient } from './auth.repository-helpers';

@Injectable()
export class AuthIdentityRepository {
  constructor(private readonly prisma: PrismaService) {}

  findPrimaryByAccountId(accountId: number, tx?: DbClient) {
    return pickDbClient(this.prisma, tx).authIdentity.findFirst({
      where: { accountId, isPrimary: true },
    });
  }

  findByProviderPhone(
    provider: AuthProvider,
    providerPhone: string,
    tx?: DbClient,
  ) {
    return pickDbClient(this.prisma, tx).authIdentity.findFirst({
      where: { provider, providerPhone },
    });
  }

  createPrimaryIdentity(
    accountId: number,
    provider: AuthProvider,
    providerPhone: string,
    providerUserId?: string,
    tx?: DbClient,
  ) {
    return pickDbClient(this.prisma, tx).authIdentity.create({
      data: {
        accountId,
        provider,
        providerPhone,
        providerUserId,
        isPrimary: true,
      },
    });
  }
}
