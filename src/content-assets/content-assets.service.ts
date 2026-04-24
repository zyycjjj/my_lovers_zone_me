import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { getDateKey } from '../common/date';
import { EventService } from '../event/event.service';
import { PrismaService } from '../prisma/prisma.service';

type ToolKey = 'title' | 'script' | 'refine' | 'commission';

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
  }) {
    const take = Math.min(Math.max(input.limit ?? 20, 1), 100);
    return this.prisma.contentAsset.findMany({
      where: input.accountId
        ? { OR: [{ accountId: input.accountId }, { userId: input.userId }] }
        : { userId: input.userId },
      orderBy: { createdAt: 'desc' },
      take,
    });
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
