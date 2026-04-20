import { AuthProvider, Prisma } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type DbClient = Prisma.TransactionClient;

const pickDbClient = (prisma: PrismaService, tx?: DbClient) => tx ?? prisma;

@Injectable()
export class AccountRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: number, tx?: DbClient) {
    return pickDbClient(this.prisma, tx).account.findUnique({ where: { id } });
  }

  findByPhone(phone: string, tx?: DbClient) {
    return pickDbClient(this.prisma, tx).account.findUnique({
      where: { phone },
    });
  }

  createByPhone(phone: string, tx?: DbClient) {
    return pickDbClient(this.prisma, tx).account.create({
      data: {
        phone,
        phoneVerifiedAt: new Date(),
        status: 'active',
      },
    });
  }

  updateDisplayName(id: number, displayName: string, tx?: DbClient) {
    return pickDbClient(this.prisma, tx).account.update({
      where: { id },
      data: { displayName },
    });
  }

  createPasswordAccount(
    payload: {
      phone: string;
      passwordHash: string;
      passwordSalt: string;
      displayName?: string;
    },
    tx?: DbClient,
  ) {
    return pickDbClient(this.prisma, tx).account.create({
      data: {
        phone: payload.phone,
        passwordHash: payload.passwordHash,
        passwordSalt: payload.passwordSalt,
        displayName: payload.displayName || undefined,
        status: 'active',
      },
    });
  }

  updatePasswordCredential(
    id: number,
    payload: {
      passwordHash: string;
      passwordSalt: string;
      displayName?: string;
    },
    tx?: DbClient,
  ) {
    return pickDbClient(this.prisma, tx).account.update({
      where: { id },
      data: {
        passwordHash: payload.passwordHash,
        passwordSalt: payload.passwordSalt,
        ...(payload.displayName ? { displayName: payload.displayName } : {}),
      },
    });
  }
}

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
