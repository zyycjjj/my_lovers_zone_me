import { Injectable } from '@nestjs/common';
import { getDateKey } from '../common/date';
import { CheckinsService, MoodType } from '../checkins/checkins.service';
import { EventService } from '../event/event.service';
import { PrismaService } from '../prisma/prisma.service';

type ToolKey = 'title' | 'script' | 'refine' | 'commission';

export type RecommendationResult = {
  /** 推荐的下一步工具 */
  suggestTool: ToolKey | null;
  /** 推荐提示文案（自然语言，非AI味） */
  hint: string;
  /** 推荐理由（用于调试和解释） */
  reason: string;
  /** 用户今日心情 */
  todayMood: MoodType | null;
  /** 今日目标 */
  todayGoal: string | null;
  /** 最近一次内容资产 */
  latestAsset: {
    id: number;
    toolKey: string;
    title?: string | null;
    status: string;
  } | null;
  /** 工具使用偏好（近7天） */
  toolPreference: Record<string, number>;
};

/** 心情 → 默认推荐的工具 + 提示 */
const MOOD_TOOL_MAP: Record<MoodType, { tool: ToolKey; hint: string }> = {
  energized: {
    tool: 'script',
    hint: '状态好，直接出一版能用的脚本，存下来明天接着改。',
  },
  rushed: {
    tool: 'title',
    hint: '时间紧的话先出几条标题，挑一条最快的发。',
  },
  unsure: {
    tool: 'title',
    hint: '不确定方向就先出标题，从标题反推要写的内容。',
  },
  tired: {
    tool: 'title',
    hint: '累了不用硬撑，出几条标题放着，哪天有状态再展开写。',
  },
};

/** 工具链关系：做完A后推荐B */
const TOOL_CHAIN: Record<ToolKey, { next: ToolKey; hint: string }> = {
  title: { next: 'script', hint: '标题有了，接下来写配套的脚本更顺。' },
  script: { next: 'refine', hint: '脚本写好了，提炼一下话术会更稳。' },
  refine: { next: 'title', hint: '话术整理完了，回头再出一组新标题。' },
  commission: { next: 'script', hint: '佣金算清了，写个脚本把这些卖点串起来。' },
};

@Injectable()
export class RecommendationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly checkins: CheckinsService,
    private readonly events: EventService,
  ) {}

  async getRecommendation(userId: number): Promise<RecommendationResult> {
    const today = getDateKey();
    const yesterday = (() => {
      const d = new Date(today);
      d.setDate(d.getDate() - 1);
      return d.toISOString().slice(0, 10);
    })();

    // 并行查询所有需要的数据
    const [todayCheckin, latestAsset, behaviorStats, yesterdayAssets] = await Promise.all([
      this.checkins.getTodayCheckin(userId),
      this.prisma.contentAsset.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: { id: true, toolKey: true, title: true, status: true },
      }),
      this.events.getUserBehaviorStats(userId, 7),
      // 昨天生成的内容
      this.prisma.contentAsset.findMany({
        where: {
          userId,
          createdAt: { gte: `${yesterday}T00:00:00.000Z`, lt: `${today}T00:00:00.000Z` },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    const todayMood = (todayCheckin?.mood as MoodType) || null;
    const todayGoal = todayCheckin?.goalKey || null;
    const toolUsage = behaviorStats.toolUsage;

    // ===== 规则引擎（优先级从高到低） =====

    // 规则1: 有最近资产 → 基于工具链推荐"下一步"
    if (latestAsset) {
      const lastTool = latestAsset.toolKey as ToolKey;
      if (lastTool in TOOL_CHAIN) {
        const chain = TOOL_CHAIN[lastTool];
        // 如果上一个资产还是 saved 状态（未完成），优先建议完成它
        if (latestAsset.status === 'saved') {
          return {
            suggestTool: chain.next,
            hint: `上次「${latestAsset.title || lastTool}」还存着，${chain.hint}`,
            reason: 'tool_chain_with_saved_asset',
            todayMood,
            todayGoal,
            latestAsset,
            toolPreference: toolUsage,
          };
        }
        return {
          suggestTool: chain.next,
          hint: chain.hint,
          reason: 'tool_chain_completed',
          todayMood,
          todayGoal,
          latestAsset,
          toolPreference: toolUsage,
        };
      }
    }

    // 规则2: 今日有打卡心情 → 按心情推荐默认工具
    if (todayMood && todayMood in MOOD_TOOL_MAP) {
      const moodRec = MOOD_TOOL_MAP[todayMood];
      return {
        suggestTool: moodRec.tool,
        hint: moodRec.hint,
        reason: 'mood_based',
        todayMood,
        todayGoal,
        latestAsset,
        toolPreference: toolUsage,
      };
    }

    // 规则3: 有昨日资产但今天还没开工 → 联动推荐
    if (yesterdayAssets.length > 0 && !todayCheckin) {
      const yAsset = yesterdayAssets[0];
      const yTool = yAsset.toolKey as ToolKey;
      const chain = TOOL_CHAIN[yTool];
      if (chain) {
        return {
          suggestTool: chain.next,
          hint: `昨天做了「${yAsset.title || yTool}」，今天${chain.hint}`,
          reason: 'yesterday_continue',
          todayMood,
          todayGoal,
          latestAsset,
          toolPreference: toolUsage,
        };
      }
    }

    // 规则4: 有使用偏好 → 推荐最少使用的工具（平衡使用）
    const allTools: ToolKey[] = ['title', 'script', 'refine', 'commission'];
    const usageCounts = allTools.map((t) => ({ tool: t, count: toolUsage[t] || 0 }));
    usageCounts.sort((a, b) => a.count - b.count); // 升序，最少的在前
    const leastUsed = usageCounts[0];

    // 如果某个工具完全没用过，优先推荐它
    if (leastUsed.count === 0) {
      const toolHints: Record<ToolKey, string> = {
        title: '试试生成一组标题，从零开始也很快。',
        script: '直接写一篇完整脚本，比一条条拼效率高。',
        refine: '把之前写过的内容贴进来，帮你整理得更稳。',
        commission: '算一算佣金空间，心里更有数。',
      };
      return {
        suggestTool: leastUsed.tool,
        hint: toolHints[leastUsed.tool],
        reason: 'balance_usage',
        todayMood,
        todayGoal,
        latestAsset,
        toolPreference: toolUsage,
      };
    }

    // 规则5: 兜底 → 用最多的工具的反向推荐（避免单一化）
    const mostUsed = usageCounts[usageCounts.length - 1];
    const otherTools = allTools.filter((t) => t !== mostUsed.tool);
    const fallbackTool = otherTools[0] || 'title';

    return {
      suggestTool: fallbackTool,
      hint: '选一个方向开始今天的内容，存下来就是自己的素材库。',
      reason: 'fallback',
      todayMood,
      todayGoal,
      latestAsset,
      toolPreference: toolUsage,
    };
  }
}
