import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { getDateKey } from '../common/date';
import { PrismaService } from '../prisma/prisma.service';

export type MoodType = 'energized' | 'rushed' | 'unsure' | 'tired';

const MOOD_LABELS: Record<MoodType, string> = {
  energized: '有状态',
  rushed: '赶时间',
  unsure: '找灵感',
  tired: '先试试',
};

const MOOD_HINTS: Record<MoodType, string> = {
  energized: '状态好的时候，先出一版能直接发的内容',
  rushed: '时间紧的话，先出标题挑一条最快的发',
  unsure: '不确定方向的话，从最近做过的内容接着来',
  tired: '累了就先来一条，不用追求完美',
};

const GOAL_CONTINUE_HINTS: Record<string, { toolLabel: string; nextSuggestion: string }> = {
  publish: { toolLabel: '脚本', nextSuggestion: '可以继续做转化脚本' },
  new_product: { toolLabel: '标题', nextSuggestion: '可以继续写配套文案' },
  convert: { toolLabel: '话术', nextSuggestion: '可以再优化一版更稳的表达' },
};

@Injectable()
export class CheckinsService {
  constructor(private prisma: PrismaService) {}

  /** 用户今日开工打卡 */
  async checkIn(userId: number, dto: { mood: MoodType; goalKey?: string; sourceHint?: string }) {
    const today = this.getTodayKey();

    // 检查是否已打卡
    const existing = await this.prisma.dailyCheckin.findUnique({
      where: { userId_date: { userId, date: today } },
    });
    if (existing) {
      // 更新已有记录（允许修改心情和目标）
      return this.prisma.dailyCheckin.update({
        where: { id: existing.id },
        data: {
          mood: dto.mood,
          goalKey: dto.goalKey ?? existing.goalKey,
          sourceHint: dto.sourceHint ?? existing.sourceHint,
        },
      });
    }

    return this.prisma.dailyCheckin.create({
      data: {
        userId,
        date: today,
        mood: dto.mood,
        goalKey: dto.goalKey,
        sourceHint: dto.sourceHint,
      },
    });
  }

  /** 获取今日开工状态 */
  async getTodayCheckin(userId: number) {
    const today = this.getTodayKey();
    return this.prisma.dailyCheckin.findUnique({
      where: { userId_date: { userId, date: today } },
    });
  }

  /** 获取最近 N 天开工记录 */
  async getRecentCheckins(userId: number, days = 7) {
    const since = this.getDateKeyDaysAgo(days);
    return this.prisma.dailyCheckin.findMany({
      where: { userId, date: { gte: since } },
      orderBy: { date: 'desc' },
    });
  }

  /** 获取连续打卡天数 */
  async getStreakCount(userId: number): Promise<number> {
    const checkins = await this.prisma.dailyCheckin.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      select: { date: true },
    });

    if (checkins.length === 0) return 0;

    let streak = 0;
    const today = this.getTodayKey();
    const yesterday = this.getDateKeyDaysAgo(1);

    // 检查今天或昨天是否有打卡（允许中断1天）
    const hasToday = checkins[0].date === today;
    const hasYesterday = checkins[0].date === yesterday;

    if (!hasToday && !hasYesterday) return 0;

    for (let i = 0; i < checkins.length; i++) {
      const expected = hasToday
        ? this.getDateKeyDaysAgo(i)
        : this.getDateKeyDaysAgo(i + 1); // 从昨天开始算

      if (i < checkins.length && checkins[i].date === expected) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  /**
   * 构建开工面板数据
   * 包含：昨日建议、心情提示、目标选项、连续天数
   */
  async buildCheckinPanelData(userId: number) {
    const today = this.getTodayKey();
    const yesterday = this.getDateKeyDaysAgo(1);

    const [todayCheckin, yesterdayCheckin, recentAssets, streak] = await Promise.all([
      this.getTodayCheckin(userId),
      this.prisma.dailyCheckin.findUnique({ where: { userId_date: { userId, date: yesterday } } }),
      // 取昨天生成的内容资产
      this.prisma.contentAsset.findMany({
        where: {
          userId,
          createdAt: { gte: `${yesterday}T00:00:00.000Z`, lt: `${today}T00:00:00.000Z` },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      this.getStreakCount(userId),
    ]);

    // 构建昨日联动提示
    let continueHint: string | null = null;
    if (recentAssets.length > 0 && yesterdayCheckin?.goalKey) {
      const lastAsset = recentAssets[0];
      const goalHint = GOAL_CONTINUE_HINTS[yesterdayCheckin.goalKey];
      if (goalHint) {
        continueHint = `昨天你完成了「${lastAsset.title || goalHint.toolLabel}」，今天${goalHint.nextSuggestion}`;
      }
    } else if (recentAssets.length > 0) {
      const lastAsset = recentAssets[0];
      continueHint = `昨天保存了「${lastAsset.title || '内容'}」，今天可以继续往下做`;
    } else if (!yesterdayCheckin) {
      continueHint = null; // 首次使用，不显示
    } else {
      continueHint = '昨天已开工，今天选个目标继续吧';
    }

    return {
      todayCheckin: todayCheckin
        ? {
            mood: todayCheckin.mood,
            moodLabel: MOOD_LABELS[todayCheckin.mood as MoodType] || todayCheckin.mood,
            goalKey: todayCheckin.goalKey,
            sourceHint: todayCheckin.sourceHint,
          }
        : null,
      yesterdayMood: yesterdayCheckin?.mood || null,
      yesterdayGoalKey: yesterdayCheckin?.goalKey || null,
      continueHint,
      moodHints: MOOD_HINTS,
      moodLabels: MOOD_LABELS,
      streak,
    };
  }

  private getTodayKey(): string {
    return getDateKey();
  }

  private getDateKeyDaysAgo(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return getDateKey(d);
  }
}
