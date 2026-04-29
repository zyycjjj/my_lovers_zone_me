import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type PlanStatus = 'active' | 'completed' | 'archived' | 'cancelled';
type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';

const DEFAULT_7DAY_TASKS = [
  {
    dayNumber: 1,
    title: '明确本周目标',
    description: '确定这周要发布的内容类型和数量',
    hint: '先想清楚：发内容、上新、还是做转化？',
    toolKey: null,
  },
  {
    dayNumber: 2,
    title: '生成第一条内容',
    description: '用AI工具生成你的第一篇内容草稿',
    hint: '选择一个目标，开始生成标题或脚本',
    toolKey: 'title',
  },
  {
    dayNumber: 3,
    title: '完善脚本细节',
    description: '基于昨天的标题，生成完整脚本',
    hint: '把标题变成可以直接说的内容',
    toolKey: 'script',
  },
  {
    dayNumber: 4,
    title: '优化与调整',
    description: '对生成的内容进行润色优化',
    hint: '试试refine功能，让内容更适合你的风格',
    toolKey: 'refine',
  },
  {
    dayNumber: 5,
    title: '准备转化话术',
    description: '为内容添加转化引导语',
    hint: '好内容需要好结尾，试试commission工具',
    toolKey: 'commission',
  },
  {
    dayNumber: 6,
    title: '整理素材库',
    description: '保存这周生成的所有有用内容',
    hint: '把觉得不错的内容都保存下来',
    toolKey: null,
  },
  {
    dayNumber: 7,
    title: '周复盘与规划',
    description: '回顾本周完成情况，制定下周计划',
    hint: '标记所有完成的任务，准备开始新一周',
    toolKey: null,
  },
];

@Injectable()
export class ContentPlansService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: {
    userId: number;
    title?: string;
    type?: string;
  }) {
    const title = input.title?.trim() || '7天内容计划';
    const plan = await this.prisma.contentPlan.create({
      data: {
        userId: input.userId,
        title,
        type: input.type || 'weekly',
        startedAt: new Date(),
        tasks: {
          create: DEFAULT_7DAY_TASKS.map((task) => ({
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
      progressPercent: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      currentDay: this.getCurrentDay(plan),
    };
  }

  private getCurrentDay(
    plan: {
      startedAt?: Date | null;
      tasks: Array<{ status: string; dayNumber: number }>;
    },
  ): number | null {
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
