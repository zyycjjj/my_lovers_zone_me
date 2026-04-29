import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { getDateKey } from '../common/date';
import { EventService } from '../event/event.service';
import { PrismaService } from '../prisma/prisma.service';

type ToolKey = 'title' | 'script' | 'refine' | 'commission';
type AssetStatus = 'saved' | 'completed' | 'archived';

@Injectable()
export class ContentAssetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventService,
  ) {}

  private async resolveWorkspaceId(accountId?: number) {
    if (!accountId) return undefined;
    const member = await this.prisma.workspaceMember.findFirst({
      where: { accountId, status: 'active' },
      orderBy: { joinedAt: 'asc' },
      select: { workspaceId: true },
    });
    return member?.workspaceId;
  }

  private async recordAction(userId: number, action: 'saved' | 'completed') {
    try {
      await this.events.recordEvent(
        userId,
        'button_used',
        `content.${action}`,
        getDateKey(),
      );
    } catch {
      // 行为记录失败不应打断用户保存内容。
    }
  }

  async create(input: {
    userId: number;
    accountId?: number;
    toolKey: ToolKey;
    title?: string;
    content: string;
    sourcePrompt?: string;
    markCompleted?: boolean;
  }) {
    const content = input.content.trim();
    if (!content) throw new BadRequestException('Content is required');

    const workspaceId = await this.resolveWorkspaceId(input.accountId);
    const completed = Boolean(input.markCompleted);
    const asset = await this.prisma.contentAsset.create({
      data: {
        userId: input.userId,
        accountId: input.accountId,
        workspaceId,
        toolKey: input.toolKey,
        title: input.title?.trim() || null,
        content,
        sourcePrompt: input.sourcePrompt?.trim() || null,
        status: completed ? 'completed' : 'saved',
        completedAt: completed ? new Date() : null,
      },
    });

    await this.recordAction(input.userId, completed ? 'completed' : 'saved');
    return asset;
  }

  async listMine(input: {
    userId: number;
    accountId?: number;
    limit?: number;
    date?: string;
    status?: AssetStatus;
  }) {
    const take = Math.min(Math.max(input.limit ?? 20, 1), 100);
    const where: Record<string, unknown> = input.accountId
      ? { OR: [{ accountId: input.accountId }, { userId: input.userId }] }
      : { userId: input.userId };

    if (input.date) {
      where.createdAt = { gte: new Date(`${input.date}T00:00:00.000Z`), lt: new Date(`${input.date}T23:59:59.999Z`) };
    }
    if (input.status) {
      where.status = input.status;
    }

    return this.prisma.contentAsset.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
    });
  }

  async getStats(input: {
    userId: number;
    accountId?: number;
  }) {
    const baseWhere = input.accountId
      ? { OR: [{ accountId: input.accountId }, { userId: input.userId }] }
      : { userId: input.userId };

    const today = getDateKey();
    const yesterday = (() => {
      const d = new Date(today);
      d.setDate(d.getDate() - 1);
      return d.toISOString().slice(0, 10);
    })();

    const [
      totalSaved,
      totalCompleted,
      todayCreated,
      yesterdayCreated,
      latestAsset,
    ] = await Promise.all([
      this.prisma.contentAsset.count({ where: { ...baseWhere, status: 'saved' } }),
      this.prisma.contentAsset.count({ where: { ...baseWhere, status: 'completed' } }),
      this.prisma.contentAsset.count({
        where: {
          ...baseWhere,
          createdAt: { gte: new Date(`${today}T00:00:00.000Z`), lt: new Date(`${today}T23:59:59.999Z`) },
        },
      }),
      this.prisma.contentAsset.count({
        where: {
          ...baseWhere,
          createdAt: { gte: new Date(`${yesterday}T00:00:00.000Z`), lt: new Date(`${yesterday}T23:59:59.999Z`) },
        },
      }),
      this.prisma.contentAsset.findFirst({
        where: baseWhere,
        orderBy: { createdAt: 'desc' },
        select: { id: true, toolKey: true, title: true, status: true, createdAt: true },
      }),
    ]);

    return {
      totalSaved,
      totalCompleted,
      totalAll: totalSaved + totalCompleted,
      todayCreated,
      yesterdayCreated,
      latestAsset,
    };
  }

  async markCompleted(input: {
    id: number;
    userId: number;
    accountId?: number;
  }) {
    const asset = await this.prisma.contentAsset.findFirst({
      where: input.accountId
        ? {
            id: input.id,
            OR: [{ accountId: input.accountId }, { userId: input.userId }],
          }
        : { id: input.id, userId: input.userId },
    });

    if (!asset) throw new NotFoundException('Content asset not found');

    const updated = await this.prisma.contentAsset.update({
      where: { id: input.id },
      data: { status: 'completed', completedAt: new Date() },
    });

    await this.recordAction(input.userId, 'completed');
    return updated;
  }
}
