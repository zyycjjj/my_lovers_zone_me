import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { getDateKey } from '../common/date';
import { EntitlementsService } from '../entitlements/entitlements.service';
import { EventService } from '../event/event.service';
import { KnowledgeService } from '../knowledge/knowledge.service';
import { PrismaService } from '../prisma/prisma.service';

function tryParseJson<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

function extractJson(text: string) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start >= 0 && end > start) return text.slice(start, end + 1);
  return text;
}

function detectPlatformFromUrl(url: string): string {
  if (url.includes('xiaohongshu') || url.includes('xhslink')) return 'xiaohongshu';
  if (url.includes('douyin') || url.includes('iesdouyin')) return 'douyin';
  if (url.includes('kuaishou')) return 'kuaishou';
  return 'other';
}

@Injectable()
export class ViralService {
  constructor(
    private readonly ai: AiService,
    private readonly entitlements: EntitlementsService,
    private readonly events: EventService,
    private readonly knowledge: KnowledgeService,
    private readonly prisma: PrismaService,
  ) {}

  private async autoSaveAsset(input: {
    userId: number;
    accountId?: number;
    toolKey: string;
    title?: string;
    content: string;
    sourcePrompt?: string;
  }) {
    try {
      const asset = await this.prisma.contentAsset.create({
        data: {
          userId: input.userId,
          accountId: input.accountId,
          toolKey: input.toolKey,
          title: input.title?.trim() || null,
          content: input.content.trim(),
          sourcePrompt: input.sourcePrompt?.trim() || null,
          status: 'saved',
        },
      });
      return asset.id;
    } catch {
      return undefined;
    }
  }

  private async incrementToolUsedSafely(userId: number, toolKey: string) {
    try {
      await this.events.incrementToolUsed(userId, toolKey, getDateKey());
    } catch {
      // 埋点失败不影响主流程
    }
  }

  async analyze(
    userId: number,
    accountId: number | undefined,
    input: {
      source: string;
      sourcePlatform?: string;
      myProduct?: string;
      myPlatform?: string;
      style?: string;
    },
  ) {
    await this.entitlements.assertCanUseTool({
      userId,
      accountId,
      toolKey: 'viral',
    });

    const isUrl = input.source.startsWith('http');
    const detectedPlatform = input.sourcePlatform || (isUrl ? detectPlatformFromUrl(input.source) : 'other');
    const platformLabels: Record<string, string> = {
      xiaohongshu: '小红书',
      douyin: '抖音',
      kuaishou: '快手',
      other: '社交平台',
    };
    const platformLabel = platformLabels[detectedPlatform] || '社交平台';

    const userContext = await this.knowledge.buildUserContext(accountId);

    // 第一步：拆解爆款结构
    const analyzePrompt = [
      `你是资深内容运营分析师。请对以下${platformLabel}爆款内容进行深度拆解。`,
      isUrl ? `内容链接：${input.source}` : `内容原文：${input.source}`,
      ``,
      `请返回JSON对象，不要任何额外文字，字段如下：`,
      `{`,
      `  "title": "内容标题",`,
      `  "hook": "开头钩子策略（3秒内怎么抓住注意力）",`,
      `  "structure": [`,
      `    { "step": "步骤名", "description": "这一步做了什么", "technique": "用到的技巧" }`,
      `  ],`,
      `  "sellingPoints": ["卖点是哪几条"],`,
      `  "rhythmStrategy": "节奏策略（怎么安排信息密度）",`,
      `  "ctaAction": "转化动作（怎么引导用户行动）",`,
      `  "emotionalTrigger": "情绪触发点",`,
      `  "targetAudience": "目标受众",`,
      `  "viralFactors": ["为什么会火的关键因素"],`,
      `  "platformStyle": "这个平台的风格特点",`,
      `  "risks": ["可能存在的合规风险"]`,
      `}`,
      ``,
      `要求：structure 至少4步、sellingPoints 3-5条、viralFactors 3-5条。`,
      `用中文输出。`,
    ].join('\n');

    let structureRaw = '';
    try {
      structureRaw = await this.ai.chatText({
        user: analyzePrompt,
        maxTokens: 2000,
        timeoutMs: 30000,
      });
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        // AI 不可用时的兜底拆解
        return this.fallbackAnalyze(userId, accountId, input, detectedPlatform);
      }
      throw error;
    }

    const structureParsed = tryParseJson<{
      title?: string;
      hook?: string;
      structure?: unknown[];
      sellingPoints?: unknown[];
      rhythmStrategy?: string;
      ctaAction?: string;
      emotionalTrigger?: string;
      targetAudience?: string;
      viralFactors?: unknown[];
      platformStyle?: string;
      risks?: unknown[];
    }>(extractJson(structureRaw));

    const structure = {
      title: structureParsed?.title || '爆款内容',
      hook: structureParsed?.hook || '',
      structure: Array.isArray(structureParsed?.structure)
        ? (structureParsed.structure as unknown[]).filter((x) => typeof x === 'object' && x !== null)
        : [],
      sellingPoints: Array.isArray(structureParsed?.sellingPoints)
        ? (structureParsed.sellingPoints as unknown[]).filter((x) => typeof x === 'string').slice(0, 5)
        : [],
      rhythmStrategy: structureParsed?.rhythmStrategy || '',
      ctaAction: structureParsed?.ctaAction || '',
      emotionalTrigger: structureParsed?.emotionalTrigger || '',
      targetAudience: structureParsed?.targetAudience || '',
      viralFactors: Array.isArray(structureParsed?.viralFactors)
        ? (structureParsed.viralFactors as unknown[]).filter((x) => typeof x === 'string').slice(0, 5)
        : [],
      platformStyle: structureParsed?.platformStyle || '',
      risks: Array.isArray(structureParsed?.risks)
        ? (structureParsed.risks as unknown[]).filter((x) => typeof x === 'string').slice(0, 5)
        : [],
    };

    // 第二步：结合用户知识库生成我的版本
    const myProduct = input.myProduct || '';
    const myPlatform = input.myPlatform || '';
    const style = input.style || '';

    const generatePrompt = [
      `你是资深内容创作顾问。基于以下爆款拆解结果，结合用户的实际情况，生成一版属于用户自己的内容。`,
      ``,
      `爆款拆解结果：`,
      `标题：${structure.title}`,
      `钩子策略：${structure.hook}`,
      `结构步骤：${structure.structure.map((s: any, i: number) => `${i + 1}. ${s.step || ''}：${s.description || ''}（技巧：${s.technique || ''}）`).join('\n')}`,
      `卖点：${structure.sellingPoints.join('、')}`,
      `节奏策略：${structure.rhythmStrategy}`,
      `转化动作：${structure.ctaAction}`,
      `情绪触发：${structure.emotionalTrigger}`,
      `爆款因素：${structure.viralFactors.join('、')}`,
      ``,
      `用户实际情况：`,
      myProduct ? `我的商品：${myProduct}` : '',
      myPlatform ? `我要发在：${myPlatform}` : '',
      style ? `风格偏好：${style}` : '',
      userContext,
      ``,
      `请返回JSON对象，不要任何额外文字，字段如下：`,
      `{`,
      `  "title": "为用户生成的标题",`,
      `  "hook": "3秒开场钩子",`,
      `  "content30s": "30秒版本内容",`,
      `  "content60s": "60秒版本内容（可选）",`,
      `  "sellingPoints": ["3-5条适配用户商品的卖点"],`,
      `  "ctaLine": "转化引导话术",`,
      `  "adaptationNotes": ["2-3条说明：为什么这样改更适合用户"]`,
      `}`,
      ``,
      `要求：`,
      `- 不是简单换词，而是结合用户的商品和平台重新组织`,
      `- 保持原爆款的节奏和钩子逻辑，但内容完全适配用户`,
      `- 避免极限词和医疗功效承诺`,
      `用中文输出。`,
    ].filter(Boolean).join('\n');

    let myVersionRaw = '';
    try {
      myVersionRaw = await this.ai.chatText({
        user: generatePrompt,
        maxTokens: 2000,
        timeoutMs: 30000,
      });
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        // 拆解成功了但生成失败，返回拆解结果 + 空生成
        await this.incrementToolUsedSafely(userId, 'viral');
        return {
          structure,
          myVersion: null,
          explosionCaseId: undefined,
          assetId: undefined,
        };
      }
      throw error;
    }

    const myVersionParsed = tryParseJson<{
      title?: string;
      hook?: string;
      content30s?: string;
      content60s?: string;
      sellingPoints?: unknown[];
      ctaLine?: string;
      adaptationNotes?: unknown[];
    }>(extractJson(myVersionRaw));

    const myVersion = {
      title: myVersionParsed?.title || '',
      hook: myVersionParsed?.hook || '',
      content30s: myVersionParsed?.content30s || '',
      content60s: myVersionParsed?.content60s || '',
      sellingPoints: Array.isArray(myVersionParsed?.sellingPoints)
        ? (myVersionParsed.sellingPoints as unknown[]).filter((x) => typeof x === 'string').slice(0, 5)
        : [],
      ctaLine: myVersionParsed?.ctaLine || '',
      adaptationNotes: Array.isArray(myVersionParsed?.adaptationNotes)
        ? (myVersionParsed.adaptationNotes as unknown[]).filter((x) => typeof x === 'string').slice(0, 3)
        : [],
    };

    // 保存结果
    await this.incrementToolUsedSafely(userId, 'viral');

    const sourcePrompt = [input.source, myProduct, myPlatform, style].filter(Boolean).join(' | ');
    const contentStr = JSON.stringify({ structure, myVersion });

    const assetId = await this.autoSaveAsset({
      userId,
      accountId,
      toolKey: 'viral',
      title: myVersion.title || structure.title || '爆款复刻',
      content: contentStr,
      sourcePrompt,
    });

    const explosionCase = await this.prisma.explosionCase.create({
      data: {
        userId,
        accountId: accountId || null,
        sourceUrl: isUrl ? input.source : null,
        sourcePlatform: detectedPlatform,
        sourceContent: isUrl ? null : input.source,
        structureJson: JSON.stringify(structure),
        myVersion: JSON.stringify(myVersion),
        myVersionPrompt: sourcePrompt,
        assetId: assetId || null,
      },
    });

    return {
      structure,
      myVersion,
      explosionCaseId: explosionCase.id,
      assetId,
    };
  }

  private async fallbackAnalyze(
    userId: number,
    accountId: number | undefined,
    input: { source: string; sourcePlatform?: string; myProduct?: string; myPlatform?: string; style?: string },
    detectedPlatform: string,
  ) {
    const structure = {
      title: '爆款内容拆解',
      hook: '开头使用强情绪词或悬念句，3秒内抓住注意力',
      structure: [
        { step: '开场钩子', description: '用反问或强描述开场', technique: '制造好奇' },
        { step: '痛点共鸣', description: '说出目标用户的痛点', technique: '引发共鸣' },
        { step: '方案展示', description: '自然引出产品或方案', technique: '场景代入' },
        { step: '转化引导', description: '给出明确的行动指令', technique: '降低决策成本' },
      ],
      sellingPoints: ['切入点精准', '情绪共鸣强', '节奏紧凑', '转化明确'],
      rhythmStrategy: '快节奏开场 → 痛点慢铺 → 方案快出 → 转化收尾',
      ctaAction: '引导评论/私信/下单',
      emotionalTrigger: '好奇 + 共鸣',
      targetAudience: '内容创作者和带货商家',
      viralFactors: ['钩子强', '共鸣深', '节奏快', '可复刻'],
      platformStyle: '口语化、真实感、短平快',
      risks: [],
    };

    const myVersion = {
      title: input.myProduct ? `为你定制的${input.myProduct}内容` : '基于爆款结构的定制版本',
      hook: `${input.myProduct || '这款产品'}真的让人眼前一亮，看完你就知道为什么那么多人推荐。`,
      content30s: input.myProduct
        ? `先说结论：${input.myProduct}确实值得试。好看好用，${input.myPlatform ? `特别适合在${input.myPlatform}推荐。` : '日常用很实用。'}关键是性价比高，现在入手正合适。`
        : '结合你自己的商品和平台，把爆款的逻辑套进去，效果不会差。',
      content60s: '',
      sellingPoints: ['结构清晰', '节奏紧凑', '可快速复刻'],
      ctaLine: '想要的扣1，我把链接放评论区。',
      adaptationNotes: ['保持了原爆款的节奏和钩子逻辑', '内容完全适配你的商品'],
    };

    await this.incrementToolUsedSafely(userId, 'viral');

    const sourcePrompt = [input.source, input.myProduct, input.myPlatform, input.style].filter(Boolean).join(' | ');
    const contentStr = JSON.stringify({ structure, myVersion });

    const assetId = await this.autoSaveAsset({
      userId,
      accountId,
      toolKey: 'viral',
      title: myVersion.title,
      content: contentStr,
      sourcePrompt,
    });

    const explosionCase = await this.prisma.explosionCase.create({
      data: {
        userId,
        accountId: accountId || null,
        sourceUrl: input.source.startsWith('http') ? input.source : null,
        sourcePlatform: detectedPlatform,
        sourceContent: input.source.startsWith('http') ? null : input.source,
        structureJson: JSON.stringify(structure),
        myVersion: JSON.stringify(myVersion),
        myVersionPrompt: sourcePrompt,
        assetId: assetId || null,
      },
    });

    return {
      structure,
      myVersion,
      explosionCaseId: explosionCase.id,
      assetId,
    };
  }

  async listMine(userId: number, opts: { page?: number; pageSize?: number }) {
    const page = Math.max(1, opts.page || 1);
    const pageSize = Math.min(50, Math.max(1, opts.pageSize || 10));
    const [items, total] = await Promise.all([
      this.prisma.explosionCase.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { asset: { select: { id: true, status: true } } },
      }),
      this.prisma.explosionCase.count({ where: { userId } }),
    ]);
    return { items, total, page, pageSize };
  }
}
