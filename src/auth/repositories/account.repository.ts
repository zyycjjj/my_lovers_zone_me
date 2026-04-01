import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DbClient } from './repository.types';
import { pickDbClient } from './auth.repository-helpers';

@Injectable()
export class AccountRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: number, tx?: DbClient) {
    return pickDbClient(this.prisma, tx).account.findUnique({ where: { id } });
  }

  findByPhone(phone: string, tx?: DbClient) {
    return pickDbClient(this.prisma, tx).account.findUnique({ where: { phone } });
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
}
