import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class WorkspaceMemberRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByAccountId(accountId: number) {
    return this.prisma.workspaceMember.findMany({
      where: { accountId },
      orderBy: { id: 'asc' },
    });
  }
}
