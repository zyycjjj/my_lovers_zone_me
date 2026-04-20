import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DbClient } from '../../auth/repositories/auth.repository';

const pickDbClient = (prisma: PrismaService, tx?: DbClient) => tx ?? prisma;

@Injectable()
export class WorkspaceRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: number, tx?: DbClient) {
    return pickDbClient(this.prisma, tx).workspace.findUnique({
      where: { id },
    });
  }

  findOwnedByAccountId(accountId: number, tx?: DbClient) {
    return pickDbClient(this.prisma, tx).workspace.findMany({
      where: { ownerAccountId: accountId },
      orderBy: { id: 'asc' },
    });
  }

  findPersonalOwnedByAccountId(accountId: number, tx?: DbClient) {
    return pickDbClient(this.prisma, tx).workspace.findFirst({
      where: { ownerAccountId: accountId, type: 'personal' },
      orderBy: { id: 'asc' },
    });
  }

  createPersonalWorkspace(accountId: number, name: string, tx?: DbClient) {
    return pickDbClient(this.prisma, tx).workspace.create({
      data: {
        ownerAccountId: accountId,
        name,
        type: 'personal',
        status: 'active',
      },
    });
  }
}
