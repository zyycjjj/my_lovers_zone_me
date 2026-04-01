import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UserProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByAccountId(accountId: number) {
    return this.prisma.userProfile.findUnique({ where: { accountId } });
  }
}
