import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DbClient } from '../../auth/repositories/auth.repository';

const pickDbClient = (prisma: PrismaService, tx?: DbClient) => tx ?? prisma;

@Injectable()
export class WorkspaceMemberRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByAccountId(accountId: number, tx?: DbClient) {
    return pickDbClient(this.prisma, tx).workspaceMember.findMany({
      where: { accountId },
      include: { workspace: true },
      orderBy: { id: 'asc' },
    });
  }

  upsertOwnerMember(workspaceId: number, accountId: number, tx?: DbClient) {
    return pickDbClient(this.prisma, tx).workspaceMember.upsert({
      where: { workspaceId_accountId: { workspaceId, accountId } },
      create: {
        workspaceId,
        accountId,
        role: 'owner',
        status: 'active',
        joinedAt: new Date(),
      },
      update: {
        role: 'owner',
        status: 'active',
        joinedAt: new Date(),
      },
    });
  }
}
