import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { KnowledgeService } from '../knowledge/knowledge.service';
import { PrismaService } from '../prisma/prisma.service';

type PlanStatus = 'active' | 'completed' | 'archived' | 'cancelled';
type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';
type PlanTaskDraft = {
  dayNumber: number;
  title: string;
  description: string;
  hint: string;
  toolKey: string | null;
};

const PLAN_TOOL_KEYS = new Set([
  'title',
  'script',
  'refine',
  'commission',
  'viral',
]);

const DEFAULT_7DAY_TASKS: PlanTaskDraft[] = [
  {
    dayNumber: 1,
    title: '先给这一周定个调',
    description: '把这周要发什么、发几条先放到桌面上',
    hint: '别把周一过成开卷考试，先挑一个最要紧的方向。',
    toolKey: null,
  },
  {
    dayNumber: 2,
    title: '找一条顺眼的参考',
    description: '看一条同类内容，拆出开头、卖点和结尾',
    hint: '手里有链接的话，丢给爆款复刻，先让它替你拆一遍。',
    toolKey: 'viral',
  },
  {
    dayNumber: 3,
    title: '先攒一小把标题',
    description: '围绕昨天的方向，先出一组能挑的标题',
    hint: '挑一条顺眼的就行，别在标题池里泡太久。',
    toolKey: 'title',
  },
  {
    dayNumber: 4,
    title: '把标题写成正文',
    description: '基于选好的标题，写一版能直接改的正文',
    hint: '草稿先落地，漂亮话可以第二轮再补。',
    toolKey: 'script',
  },
  {
    dayNumber: 5,
    title: '把话说得更顺',
    description: '把昨天的正文改得更像你平时会说的话',
    hint: '哪里读着硌牙，就先修哪里。',
    toolKey: 'refine',
  },
  {
    dayNumber: 6,
    title: '补上转化结尾',
    description: '给内容加一段购买理由、咨询引导或直播间话术',
    hint: '结尾不用猛踩油门，把下一步说清楚就够了。',
    toolKey: 'commission',
  },
  {
    dayNumber: 7,
    title: '给这一周收个尾',
    description: '看看这周做完了什么，顺手定下下周第一步',
    hint: '把做完的勾一下，下次回来就不会一脸空白。',
    toolKey: null,
  },
];

@Injectable()
export class ContentPlansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ai?: AiService,
    private readonly knowledge?: KnowledgeService,
  ) {}

  async create(input: {
    userId: number;
    title?: string;
    type?: string;
    goal?: string;
    industry?: string;
    platform?: string;
    dailyCount?: number;
  }) {
    const title = input.title?.trim() || '7天内容计划';
    const tasks = await this.buildTasks(input);
    const plan = await this.prisma.contentPlan.create({
      data: {
        userId: input.userId,
        title,
        description: this.buildPlanDescription(input),
        type: input.type || 'weekly',
        startedAt: new Date(),
        tasks: {
          create: tasks.map((task) => ({
            dayNumber: task.dayNumber,
            title: task.title,
            description: task.description,
            hint: task.hint,
            toolKey: task.toolKey,
          })),
        },
      },
      include: { tasks: { orderBy: { dayNumber: 'asc' } } },
    });

    return plan;
  }

  private async buildTasks(input: {
    userId: number;
    goal?: string;
    industry?: string;
    platform?: string;
    dailyCount?: number;
  }): Promise<PlanTaskDraft[]> {
    if (!this.ai) return DEFAULT_7DAY_TASKS;

    try {
      const userContext =
        (await this.knowledge
          ?.buildUserContext(input.userId)
          .catch(() => '')) ?? '';
      const content = await this.ai.chatText({
        timeoutMs: 30000,
        maxTokens: 1600,
        system: '你熟悉短视频和图文内容排期。只输出 JSON，不要 Markdown。',
        user: [
          '生成一个 7 天内容排期。',
          '每天 1 个主任务。任务要具体，像真人写给自己看的待办，不要口号。需要覆盖参考同类内容、标题、正文、修改、转化结尾、复盘。toolKey 只能是 title/script/refine/commission/viral/null。',
          `目标：${input.goal?.trim() || '持续发内容'}`,
          `行业/类目：${input.industry?.trim() || '未填写'}`,
          `平台：${input.platform?.trim() || '未填写'}`,
          `每日发布数量：${input.dailyCount && input.dailyCount > 0 ? input.dailyCount : 1}`,
          userContext.trim(),
          '输出格式：{"tasks":[{"dayNumber":1,"title":"...","description":"...","hint":"...","toolKey":"viral"}]}',
        ]
          .filter(Boolean)
          .join('\n'),
      });
      return this.normalizeAiTasks(content);
    } catch {
      return this.personalizeFallbackTasks(input);
    }
  }

  private normalizeAiTasks(content: string): PlanTaskDraft[] {
    const jsonText = this.extractJson(content);
    const parsed = JSON.parse(jsonText) as { tasks?: unknown[] };
    const tasks = Array.isArray(parsed.tasks) ? parsed.tasks : [];
    const normalized = tasks
      .slice(0, 7)
      .map((raw, index) => this.normalizeTask(raw, index + 1))
      .filter((task): task is PlanTaskDraft => Boolean(task));

    if (normalized.length !== 7)
      throw new BadRequestException('Invalid plan tasks');
    return normalized.map((task, index) => ({ ...task, dayNumber: index + 1 }));
  }

  private normalizeTask(
    raw: unknown,
    fallbackDay: number,
  ): PlanTaskDraft | null {
    if (!raw || typeof raw !== 'object') return null;
    const item = raw as Record<string, unknown>;
    const title = this.cleanText(item.title, 40);
    const description = this.cleanText(item.description, 140);
    const hint = this.cleanText(item.hint, 120);
    const rawToolKey =
      typeof item.toolKey === 'string' ? item.toolKey.trim() : null;
    const toolKey =
      rawToolKey && PLAN_TOOL_KEYS.has(rawToolKey) ? rawToolKey : null;

    if (!title || !description) return null;
    return {
      dayNumber:
        typeof item.dayNumber === 'number' && Number.isFinite(item.dayNumber)
          ? item.dayNumber
          : fallbackDay,
      title,
      description,
      hint: hint || '完成后记得保存结果，明天可以接着做。',
      toolKey,
    };
  }

  private extractJson(content: string) {
    const trimmed = content.trim();
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1]?.trim();
    if (fenced) return fenced;
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start >= 0 && end > start) return trimmed.slice(start, end + 1);
    return trimmed;
  }

  private cleanText(value: unknown, maxLength: number) {
    if (typeof value !== 'string') return '';
    return value.trim().replace(/\s+/g, ' ').slice(0, maxLength);
  }

  private personalizeFallbackTasks(input: {
    goal?: string;
    industry?: string;
    platform?: string;
    dailyCount?: number;
  }): PlanTaskDraft[] {
    const goal = input.goal?.trim();
    const industry = input.industry?.trim();
    const platform = input.platform?.trim();
    const prefix = [industry, platform].filter(Boolean).join(' · ');

    return DEFAULT_7DAY_TASKS.map((task, index) => {
      if (index === 0 && goal) {
        return {
          ...task,
          description: `围绕「${goal}」，先定这周要发什么、发几条`,
        };
      }
      if (index === 1 && prefix) {
        return {
          ...task,
          description: `找一条 ${prefix} 的同类内容，拆出开头、卖点和结尾`,
        };
      }
      return task;
    });
  }

  private buildPlanDescription(input: {
    goal?: string;
    industry?: string;
    platform?: string;
    dailyCount?: number;
  }) {
    const parts = [
      input.goal?.trim() ? `目标：${input.goal.trim()}` : '',
      input.industry?.trim() ? `类目：${input.industry.trim()}` : '',
      input.platform?.trim() ? `平台：${input.platform.trim()}` : '',
      input.dailyCount && input.dailyCount > 0
        ? `每日 ${input.dailyCount} 条`
        : '',
    ].filter(Boolean);
    return parts.length ? parts.join('，') : null;
  }

  async listMine(input: {
    userId: number;
    status?: PlanStatus;
    limit?: number;
    offset?: number;
  }) {
    const take = Math.min(Math.max(input.limit ?? 10, 1), 50);
    const skip = Math.max(input.offset ?? 0, 0);
    const where: Record<string, unknown> = { userId: input.userId };
    if (input.status) where.status = input.status;

    const [items, total] = await Promise.all([
      this.prisma.contentPlan.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        skip,
        include: { tasks: { orderBy: { dayNumber: 'asc' } } },
      }),
      this.prisma.contentPlan.count({ where }),
    ]);

    return { items, total, limit: take, offset: skip };
  }

  async getDetail(input: { id: number; userId: number }) {
    const plan = await this.prisma.contentPlan.findFirst({
      where: { id: input.id, userId: input.userId },
      include: { tasks: { orderBy: { dayNumber: 'asc' } } },
    });
    if (!plan) throw new NotFoundException('Plan not found');
    return plan;
  }

  async updateTaskStatus(input: {
    planId: number;
    taskId: number;
    userId: number;
    status: TaskStatus;
    assetId?: number;
  }) {
    const task = await this.prisma.contentPlanTask.findFirst({
      where: { id: input.taskId, planId: input.planId },
      include: { plan: true },
    });

    if (!task || task.plan.userId !== input.userId) {
      throw new NotFoundException('Task not found');
    }

    const updateData: Record<string, unknown> = { status: input.status };
    if (input.status === 'completed') {
      updateData.completedAt = new Date();
    }
    if (input.assetId) {
      updateData.assetId = input.assetId;
    }

    const updated = await this.prisma.contentPlanTask.update({
      where: { id: input.taskId },
      data: updateData,
    });

    await this.checkPlanCompletion(input.planId);
    return updated;
  }

  private async checkPlanCompletion(planId: number) {
    const tasks = await this.prisma.contentPlanTask.findMany({
      where: { planId },
    });
    const allCompleted = tasks.every((t) => t.status === 'completed');
    if (allCompleted && tasks.length > 0) {
      await this.prisma.contentPlan.update({
        where: { id: planId },
        data: { status: 'completed', completedAt: new Date() },
      });
    }
  }

  async getProgress(input: { planId: number; userId: number }) {
    const plan = await this.prisma.contentPlan.findFirst({
      where: { id: input.planId, userId: input.userId },
      include: { tasks: true },
    });
    if (!plan) throw new NotFoundException('Plan not found');

    const totalTasks = plan.tasks.length;
    const completedTasks = plan.tasks.filter(
      (t) => t.status === 'completed',
    ).length;
    const inProgressTasks = plan.tasks.filter(
      (t) => t.status === 'in_progress',
    ).length;

    return {
      planId: plan.id,
      status: plan.status,
      totalTasks,
      completedTasks,
      inProgressTasks,
      progressPercent:
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      currentDay: this.getCurrentDay(plan),
    };
  }

  private getCurrentDay(plan: {
    startedAt?: Date | null;
    tasks: Array<{ status: string; dayNumber: number }>;
  }): number | null {
    if (!plan.startedAt) return null;

    const completedDays = plan.tasks
      .filter((t) => t.status === 'completed')
      .map((t) => t.dayNumber);

    if (completedDays.length === 0) return 1;

    const nextDay = Math.max(...completedDays) + 1;
    return nextDay <= plan.tasks.length ? nextDay : null;
  }

  async archive(input: { id: number; userId: number }) {
    const plan = await this.prisma.contentPlan.findFirst({
      where: { id: input.id, userId: input.userId },
    });
    if (!plan) throw new NotFoundException('Plan not found');

    return this.prisma.contentPlan.update({
      where: { id: input.id },
      data: { status: 'archived' },
    });
  }

  async delete(input: { id: number; userId: number }) {
    const plan = await this.prisma.contentPlan.findFirst({
      where: { id: input.id, userId: input.userId },
    });
    if (!plan) throw new NotFoundException('Plan not found');

    return this.prisma.contentPlan.delete({ where: { id: input.id } });
  }
}
