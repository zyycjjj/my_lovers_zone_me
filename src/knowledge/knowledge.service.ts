import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductProfileDto, UpdateProductProfileDto } from './dto/product-profile.dto';
import { UpdateUserPreferencesDto } from './dto/user-preferences.dto';

@Injectable()
export class KnowledgeService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── 用户偏好 ───

  async getPreferences(accountId: number) {
    const profile = await this.prisma.userProfile.findUnique({
      where: { accountId },
      select: {
        contentStyle: true,
        defaultAudience: true,
        brandKeywords: true,
        industry: true,
        targetPlatform: true,
        contentDirection: true,
        businessRole: true,
        currentGoal: true,
        experienceLevel: true,
      },
    });
    if (!profile) throw new NotFoundException('用户档案不存在');
    return profile;
  }

  async updatePreferences(accountId: number, dto: UpdateUserPreferencesDto) {
    const profile = await this.prisma.userProfile.findUnique({
      where: { accountId },
    });
    if (!profile) throw new NotFoundException('用户档案不存在');

    const data: Record<string, string | undefined> = {};
    if (dto.contentStyle !== undefined) data.contentStyle = dto.contentStyle;
    if (dto.defaultAudience !== undefined) data.defaultAudience = dto.defaultAudience;
    if (dto.brandKeywords !== undefined) data.brandKeywords = dto.brandKeywords;

    if (Object.keys(data).length === 0) return profile;

    return this.prisma.userProfile.update({
      where: { accountId },
      data,
      select: {
        contentStyle: true,
        defaultAudience: true,
        brandKeywords: true,
      },
    });
  }

  // ─── 商品档案 CRUD ───

  async listProducts(accountId: number) {
    const profile = await this.prisma.userProfile.findUnique({
      where: { accountId },
    });
    if (!profile) throw new NotFoundException('用户档案不存在');

    return this.prisma.productProfile.findMany({
      where: { userProfileId: profile.id },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async createProduct(accountId: number, dto: CreateProductProfileDto) {
    const profile = await this.prisma.userProfile.findUnique({
      where: { accountId },
    });
    if (!profile) throw new NotFoundException('用户档案不存在');

    return this.prisma.productProfile.create({
      data: {
        userProfileId: profile.id,
        name: dto.name,
        category: dto.category,
        price: dto.price,
        sellingPoints: dto.sellingPoints,
        targetAudience: dto.targetAudience,
        platform: dto.platform,
        notes: dto.notes,
      },
    });
  }

  async updateProduct(
    accountId: number,
    productId: number,
    dto: UpdateProductProfileDto,
  ) {
    const product = await this.findProductBelongsToAccount(accountId, productId);

    const data: Record<string, string | undefined> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.category !== undefined) data.category = dto.category;
    if (dto.price !== undefined) data.price = dto.price;
    if (dto.sellingPoints !== undefined) data.sellingPoints = dto.sellingPoints;
    if (dto.targetAudience !== undefined) data.targetAudience = dto.targetAudience;
    if (dto.platform !== undefined) data.platform = dto.platform;
    if (dto.notes !== undefined) data.notes = dto.notes;

    if (Object.keys(data).length === 0) return product;

    return this.prisma.productProfile.update({
      where: { id: product.id },
      data,
    });
  }

  async deleteProduct(accountId: number, productId: number) {
    const product = await this.findProductBelongsToAccount(accountId, productId);
    await this.prisma.productProfile.delete({ where: { id: product.id } });
    return { deleted: true };
  }

  // ─── 用户上下文（供 AI 工具调用） ───

  /**
   * 构建用户知识库上下文字符串，用于 AI prompt 注入
   */
  async buildUserContext(accountId?: number): Promise<string> {
    if (!accountId) return '';

    const profile = await this.prisma.userProfile.findUnique({
      where: { accountId },
    });
    if (!profile) return '';

    const parts: string[] = [];
    if (profile.industry) parts.push(`行业：${profile.industry}`);
    if (profile.targetPlatform) parts.push(`主平台：${profile.targetPlatform}`);
    if (profile.businessRole) parts.push(`角色：${profile.businessRole}`);
    if (profile.currentGoal) parts.push(`当前目标：${profile.currentGoal}`);
    if (profile.contentDirection) parts.push(`内容方向：${profile.contentDirection}`);
    if (profile.contentStyle) parts.push(`内容风格：${profile.contentStyle}`);
    if (profile.defaultAudience) parts.push(`目标受众：${profile.defaultAudience}`);
    if (profile.brandKeywords) parts.push(`品牌关键词：${profile.brandKeywords}`);

    // 加载商品档案摘要（取前5个）
    const products = await this.prisma.productProfile.findMany({
      where: { userProfileId: profile.id },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      select: {
        name: true,
        category: true,
        sellingPoints: true,
        targetAudience: true,
        platform: true,
      },
    });

    if (products.length > 0) {
      const productDesc = products
        .map((p) => {
          const segments = [p.name];
          if (p.category) segments.push(`类目:${p.category}`);
          if (p.sellingPoints) segments.push(`卖点:${p.sellingPoints}`);
          if (p.targetAudience) segments.push(`受众:${p.targetAudience}`);
          if (p.platform) segments.push(`平台:${p.platform}`);
          return segments.join('，');
        })
        .join('；');
      parts.push(`商品：${productDesc}`);
    }

    return parts.length ? `\n\n用户背景：${parts.join('，')}` : '';
  }

  // ─── 私有方法 ───

  private async findProductBelongsToAccount(
    accountId: number,
    productId: number,
  ) {
    const profile = await this.prisma.userProfile.findUnique({
      where: { accountId },
    });
    if (!profile) throw new NotFoundException('用户档案不存在');

    const product = await this.prisma.productProfile.findFirst({
      where: { id: productId, userProfileId: profile.id },
    });
    if (!product) throw new NotFoundException('商品档案不存在或无权操作');

    return product;
  }
}
