import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const POST_TYPES = new Set(['checkin', 'work_review', 'viral_case']);
const REACTION_KINDS = new Set(['like', 'bookmark']);

@Injectable()
export class CommunityService {
  constructor(private readonly prisma: PrismaService) {}

  async listPosts(input: { type?: string; limit?: number; offset?: number }) {
    const take = Math.min(Math.max(input.limit ?? 20, 1), 50);
    const skip = Math.max(input.offset ?? 0, 0);
    const type = input.type?.trim();
    const where = {
      status: 'published',
      ...(type && POST_TYPES.has(type) ? { type } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.communityPost.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        skip,
        include: {
          account: { select: { displayName: true } },
          asset: { select: { id: true, toolKey: true, title: true } },
          comments: {
            orderBy: { createdAt: 'desc' },
            take: 2,
            include: { account: { select: { displayName: true } } },
          },
          _count: { select: { comments: true, reactions: true } },
        },
      }),
      this.prisma.communityPost.count({ where }),
    ]);

    return { items, total, limit: take, offset: skip };
  }

  async createPost(input: {
    userId: number;
    accountId?: number;
    type: string;
    title: string;
    content: string;
    platform?: string;
    sourceUrl?: string;
    assetId?: number;
  }) {
    const type = input.type.trim();
    if (!POST_TYPES.has(type))
      throw new BadRequestException('Invalid post type');
    const title = input.title.trim();
    const content = input.content.trim();
    if (!title) throw new BadRequestException('Title is required');
    if (!content) throw new BadRequestException('Content is required');

    if (input.assetId) {
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
    }

    return this.prisma.communityPost.create({
      data: {
        userId: input.userId,
        accountId: input.accountId,
        type,
        title,
        content,
        platform: input.platform?.trim() || null,
        sourceUrl: input.sourceUrl?.trim() || null,
        assetId: input.assetId || null,
      },
      include: {
        account: { select: { displayName: true } },
        asset: { select: { id: true, toolKey: true, title: true } },
        _count: { select: { comments: true, reactions: true } },
      },
    });
  }

  async getPost(id: number) {
    const post = await this.prisma.communityPost.findFirst({
      where: { id, status: 'published' },
      include: {
        account: { select: { displayName: true } },
        asset: {
          select: { id: true, toolKey: true, title: true, content: true },
        },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: { account: { select: { displayName: true } } },
        },
        reactions: true,
      },
    });
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  async addComment(input: {
    postId: number;
    userId: number;
    accountId?: number;
    content: string;
  }) {
    const content = input.content.trim();
    if (!content) throw new BadRequestException('Comment is required');
    const post = await this.prisma.communityPost.findFirst({
      where: { id: input.postId, status: 'published' },
      select: { id: true },
    });
    if (!post) throw new NotFoundException('Post not found');

    return this.prisma.communityComment.create({
      data: {
        postId: input.postId,
        userId: input.userId,
        accountId: input.accountId,
        content,
      },
      include: { account: { select: { displayName: true } } },
    });
  }

  async toggleReaction(input: {
    postId: number;
    userId: number;
    accountId?: number;
    kind: string;
  }) {
    const kind = input.kind.trim();
    if (!REACTION_KINDS.has(kind)) {
      throw new BadRequestException('Invalid reaction');
    }
    const post = await this.prisma.communityPost.findFirst({
      where: { id: input.postId, status: 'published' },
      select: { id: true },
    });
    if (!post) throw new NotFoundException('Post not found');

    const existing = await this.prisma.communityReaction.findUnique({
      where: {
        postId_userId_kind: {
          postId: input.postId,
          userId: input.userId,
          kind,
        },
      },
    });

    if (existing) {
      await this.prisma.communityReaction.delete({
        where: { id: existing.id },
      });
      return { active: false };
    }

    await this.prisma.communityReaction.create({
      data: {
        postId: input.postId,
        userId: input.userId,
        accountId: input.accountId,
        kind,
      },
    });
    return { active: true };
  }

  async removePost(input: { postId: number; userId: number }) {
    const post = await this.prisma.communityPost.findUnique({
      where: { id: input.postId },
      select: { userId: true },
    });
    if (!post) throw new NotFoundException('Post not found');
    if (post.userId !== input.userId)
      throw new ForbiddenException('No permission');

    return this.prisma.communityPost.update({
      where: { id: input.postId },
      data: { status: 'removed' },
    });
  }
}
