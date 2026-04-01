import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuthIdentityRepository {
  constructor(private readonly prisma: PrismaService) {}

  findPrimaryByAccountId(accountId: number) {
    return this.prisma.authIdentity.findFirst({
      where: { accountId, isPrimary: true },
    });
  }
}
