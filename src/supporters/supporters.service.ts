import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SupportersService {
  constructor(private readonly prisma: PrismaService) {}

  async listMine(input: { userId: number; accountId?: number }) {
    const [owned, supporting] = await Promise.all([
      this.prisma.supportConnection.findMany({
        where: { ownerUserId: input.userId, status: { not: 'removed' } },
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { sharedAssets: true } } },
      }),
      input.accountId
        ? this.prisma.supportConnection.findMany({
            where: {
              supporterAccountId: input.accountId,
              status: { not: 'removed' },
            },
            orderBy: { acceptedAt: 'desc' },
            include: { _count: { select: { sharedAssets: true } } },
          })
        : Promise.resolve([]),
    ]);

    return { owned, supporting };
  }

  async createInvitation(input: {
    userId: number;
    accountId?: number;
    supporterName: string;
    supporterContact?: string;
    note?: string;
  }) {
    const supporterName = input.supporterName.trim();
    if (!supporterName)
      throw new BadRequestException('Supporter name is required');

    return this.prisma.supportConnection.create({
      data: {
        ownerUserId: input.userId,
        ownerAccountId: input.accountId,
        supporterName,
        supporterContact: input.supporterContact?.trim() || null,
        note: input.note?.trim() || null,
        inviteCode: await this.createInviteCode(),
      },
    });
  }

  async getInvitation(inviteCode: string) {
    const invite = await this.prisma.supportConnection.findUnique({
      where: { inviteCode },
      include: {
        ownerAccount: {
          select: { displayName: true, phone: true },
        },
      },
    });
    if (!invite || invite.status === 'removed') {
      throw new NotFoundException('Invitation not found');
    }
    return invite;
  }

  async acceptInvitation(input: { inviteCode: string; accountId?: number }) {
    if (!input.accountId) throw new BadRequestException('Account is required');
    const invite = await this.prisma.supportConnection.findUnique({
      where: { inviteCode: input.inviteCode },
    });
    if (!invite || invite.status === 'removed') {
      throw new NotFoundException('Invitation not found');
    }
    if (invite.ownerAccountId === input.accountId) {
      throw new BadRequestException('不能把自己邀请成支持者');
    }

    return this.prisma.supportConnection.update({
      where: { id: invite.id },
      data: {
        supporterAccountId: input.accountId,
        status: 'active',
        acceptedAt: invite.acceptedAt || new Date(),
      },
    });
  }

  async shareAsset(input: {
    connectionId: number;
    assetId: number;
    userId: number;
    accountId?: number;
    note?: string;
  }) {
    const connection = await this.findOwnedConnection(
      input.connectionId,
      input.userId,
    );
    if (connection.status === 'removed') {
      throw new NotFoundException('Supporter not found');
    }

    const asset = await this.prisma.contentAsset.findFirst({
      where: input.accountId
        ? {
            id: input.assetId,
            OR: [{ accountId: input.accountId }, { userId: input.userId }],
          }
        : { id: input.assetId, userId: input.userId },
      select: { id: true },
    });
    if (!asset) throw new NotFoundException('Content asset not found');

    return this.prisma.supportSharedAsset.upsert({
      where: {
        connectionId_assetId: {
          connectionId: input.connectionId,
          assetId: input.assetId,
        },
      },
      create: {
        connectionId: input.connectionId,
        assetId: input.assetId,
        ownerUserId: input.userId,
        note: input.note?.trim() || null,
      },
      update: { note: input.note?.trim() || null },
      include: { asset: true, connection: true },
    });
  }

  async listSharedWithMe(input: { accountId?: number }) {
    if (!input.accountId) return { items: [] };
    const connections = await this.prisma.supportConnection.findMany({
      where: { supporterAccountId: input.accountId, status: 'active' },
      select: { id: true },
    });
    const connectionIds = connections.map((item) => item.id);
    if (connectionIds.length === 0) return { items: [] };

    const items = await this.prisma.supportSharedAsset.findMany({
      where: { connectionId: { in: connectionIds } },
      orderBy: { createdAt: 'desc' },
      include: {
        asset: true,
        connection: {
          include: {
            ownerAccount: { select: { displayName: true, phone: true } },
          },
        },
      },
    });
    return { items };
  }

  async removeConnection(input: { connectionId: number; userId: number }) {
    await this.findOwnedConnection(input.connectionId, input.userId);
    return this.prisma.supportConnection.update({
      where: { id: input.connectionId },
      data: { status: 'removed' },
    });
  }

  private async findOwnedConnection(connectionId: number, userId: number) {
    const connection = await this.prisma.supportConnection.findUnique({
      where: { id: connectionId },
    });
    if (!connection) throw new NotFoundException('Supporter not found');
    if (connection.ownerUserId !== userId) {
      throw new ForbiddenException('No permission');
    }
    return connection;
  }

  private async createInviteCode() {
    for (let i = 0; i < 5; i += 1) {
      const inviteCode = randomBytes(9).toString('base64url');
      const existing = await this.prisma.supportConnection.findUnique({
        where: { inviteCode },
        select: { id: true },
      });
      if (!existing) return inviteCode;
    }
    throw new BadRequestException('Invite code unavailable');
  }
}
