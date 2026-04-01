import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class WorkspaceRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: number) {
    return this.prisma.workspace.findUnique({ where: { id } });
  }

  findOwnedByAccountId(accountId: number) {
    return this.prisma.workspace.findMany({
      where: { ownerAccountId: accountId },
      orderBy: { id: 'asc' },
    });
  }
}
