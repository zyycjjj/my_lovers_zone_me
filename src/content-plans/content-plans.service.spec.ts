import { ContentPlansService } from './content-plans.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  contentPlan: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  contentPlanTask: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
};

describe('ContentPlansService', () => {
  let service: ContentPlansService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ContentPlansService(mockPrisma as unknown as PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a plan with default title', async () => {
      const mockPlan = { id: 1, title: '7天内容计划', tasks: [] };
      mockPrisma.contentPlan.create.mockResolvedValue(mockPlan);

      const result = await service.create({ userId: 1 });
      expect(result).toEqual(mockPlan);
      expect(mockPrisma.contentPlan.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 1,
          title: '7天内容计划',
          type: 'weekly',
          startedAt: expect.any(Date),
          tasks: {
            create: expect.arrayContaining([
              expect.objectContaining({ dayNumber: 1 }),
              expect.objectContaining({ dayNumber: 7 }),
            ]),
          },
        }),
        include: { tasks: { orderBy: { dayNumber: 'asc' } } },
      });
    });

    it('should create a plan with custom title', async () => {
      const mockPlan = { id: 1, title: '我的自定义计划', tasks: [] };
      mockPrisma.contentPlan.create.mockResolvedValue(mockPlan);

      const result = await service.create({ userId: 1, title: '我的自定义计划' });
      expect(result.title).toBe('我的自定义计划');
    });

    it('should create 7 tasks by default', async () => {
      mockPrisma.contentPlan.create.mockResolvedValue({
        id: 1,
        title: '7天内容计划',
        tasks: new Array(7),
      });

      await service.create({ userId: 1 });
      const createCall = mockPrisma.contentPlan.create.mock.calls[0][0];
      expect(createCall.data.tasks.create).toHaveLength(7);
    });
  });

  describe('listMine', () => {
    it('should return paginated plans', async () => {
      const mockPlans = [{ id: 1 }, { id: 2 }];
      mockPrisma.contentPlan.findMany.mockResolvedValue(mockPlans);
      mockPrisma.contentPlan.count.mockResolvedValue(2);

      const result = await service.listMine({ userId: 1 });
      expect(result.items).toEqual(mockPlans);
      expect(result.total).toBe(2);
      expect(result.limit).toBe(10);
      expect(result.offset).toBe(0);
    });

    it('should filter by status', async () => {
      mockPrisma.contentPlan.findMany.mockResolvedValue([]);
      mockPrisma.contentPlan.count.mockResolvedValue(0);

      await service.listMine({ userId: 1, status: 'active' as any });
      expect(mockPrisma.contentPlan.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'active' }),
        }),
      );
    });

    it('should clamp limit to valid range', async () => {
      mockPrisma.contentPlan.findMany.mockResolvedValue([]);
      mockPrisma.contentPlan.count.mockResolvedValue(0);

      const result = await service.listMine({ userId: 1, limit: 200 });
      expect(result.limit).toBe(50);

      const result2 = await service.listMine({ userId: 1, limit: -5 });
      expect(result2.limit).toBe(1);
    });
  });

  describe('getDetail', () => {
    it('should return plan with tasks', async () => {
      const mockPlan = { id: 1, userId: 1, tasks: [{ id: 1 }] };
      mockPrisma.contentPlan.findFirst.mockResolvedValue(mockPlan);

      const result = await service.getDetail({ id: 1, userId: 1 });
      expect(result).toEqual(mockPlan);
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrisma.contentPlan.findFirst.mockResolvedValue(null);

      await expect(service.getDetail({ id: 999, userId: 1 })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw if plan belongs to another user', async () => {
      mockPrisma.contentPlan.findFirst.mockResolvedValue(null);

      await expect(service.getDetail({ id: 1, userId: 999 })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateTaskStatus', () => {
    it('should update task status and set completedAt', async () => {
      const mockTask = {
        id: 1,
        planId: 1,
        plan: { userId: 1 },
      };
      mockPrisma.contentPlanTask.findFirst.mockResolvedValue(mockTask);
      mockPrisma.contentPlanTask.update.mockResolvedValue({ ...mockTask, status: 'completed', completedAt: new Date() });
      mockPrisma.contentPlanTask.findMany.mockResolvedValue([
        { status: 'completed' },
        { status: 'completed' },
      ]);
      mockPrisma.contentPlan.update.mockResolvedValue({ id: 1, status: 'active' });

      const result = await service.updateTaskStatus({
        planId: 1,
        taskId: 1,
        userId: 1,
        status: 'completed',
      });

      expect(result.status).toBe('completed');
      expect(mockPrisma.contentPlanTask.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'completed',
            completedAt: expect.any(Date),
          }),
        }),
      );
    });

    it('should throw if task not found', async () => {
      mockPrisma.contentPlanTask.findFirst.mockResolvedValue(null);

      await expect(
        service.updateTaskStatus({
          planId: 1,
          taskId: 999,
          userId: 1,
          status: 'completed',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw if task belongs to another user', async () => {
      mockPrisma.contentPlanTask.findFirst.mockResolvedValue({
        id: 1,
        planId: 1,
        plan: { userId: 999 },
      });

      await expect(
        service.updateTaskStatus({
          planId: 1,
          taskId: 1,
          userId: 1,
          status: 'completed',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should associate asset when provided', async () => {
      const mockTask = {
        id: 1,
        planId: 1,
        plan: { userId: 1 },
      };
      mockPrisma.contentPlanTask.findFirst.mockResolvedValue(mockTask);
      mockPrisma.contentPlanTask.update.mockResolvedValue(mockTask);
      mockPrisma.contentPlanTask.findMany.mockResolvedValue([{ status: 'pending' }]);

      await service.updateTaskStatus({
        planId: 1,
        taskId: 1,
        userId: 1,
        status: 'completed',
        assetId: 42,
      });

      expect(mockPrisma.contentPlanTask.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ assetId: 42 }),
        }),
      );
    });

    it('should auto-complete plan when all tasks done', async () => {
      const mockTask = {
        id: 3,
        planId: 1,
        plan: { userId: 1 },
      };
      mockPrisma.contentPlanTask.findFirst.mockResolvedValue(mockTask);
      mockPrisma.contentPlanTask.update.mockResolvedValue(mockTask);
      mockPrisma.contentPlanTask.findMany.mockResolvedValue([
        { status: 'completed' },
        { status: 'completed' },
        { status: 'completed' },
      ]);
      mockPrisma.contentPlan.update.mockResolvedValue({ status: 'completed' });

      await service.updateTaskStatus({
        planId: 1,
        taskId: 3,
        userId: 1,
        status: 'completed',
      });

      expect(mockPrisma.contentPlan.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'completed',
            completedAt: expect.any(Date),
          }),
        }),
      );
    });
  });

  describe('getProgress', () => {
    it('should calculate progress correctly', async () => {
      const mockPlan = {
        id: 1,
        userId: 1,
        startedAt: new Date(),
        status: 'active',
        tasks: [
          { dayNumber: 1, status: 'completed' },
          { dayNumber: 2, status: 'completed' },
          { dayNumber: 3, status: 'in_progress' },
          { dayNumber: 4, status: 'pending' },
          { dayNumber: 5, status: 'pending' },
          { dayNumber: 6, status: 'pending' },
          { dayNumber: 7, status: 'pending' },
        ],
      };
      mockPrisma.contentPlan.findFirst.mockResolvedValue(mockPlan);

      const result = await service.getProgress({ planId: 1, userId: 1 });

      expect(result.totalTasks).toBe(7);
      expect(result.completedTasks).toBe(2);
      expect(result.inProgressTasks).toBe(1);
      expect(result.progressPercent).toBe(29); // 2/7 ≈ 28.57% rounded
      expect(result.currentDay).toBe(3);
    });

    it('should return null currentDay for completed plan', async () => {
      const mockPlan = {
        id: 1,
        userId: 1,
        startedAt: new Date(),
        status: 'active',
        tasks: Array(7).fill(null).map((_, i) => ({
          dayNumber: i + 1,
          status: 'completed',
        })),
      };
      mockPrisma.contentPlan.findFirst.mockResolvedValue(mockPlan);

      const result = await service.getProgress({ planId: 1, userId: 1 });
      expect(result.currentDay).toBeNull();
    });

    it('should throw if plan not found', async () => {
      mockPrisma.contentPlan.findFirst.mockResolvedValue(null);

      await expect(service.getProgress({ planId: 999, userId: 1 })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('archive', () => {
    it('should archive a plan', async () => {
      const mockPlan = { id: 1, userId: 1 };
      mockPrisma.contentPlan.findFirst.mockResolvedValue(mockPlan);
      mockPrisma.contentPlan.update.mockResolvedValue({ ...mockPlan, status: 'archived' });

      const result = await service.archive({ id: 1, userId: 1 });
      expect(result.status).toBe('archived');
    });

    it('should throw if plan not found', async () => {
      mockPrisma.contentPlan.findFirst.mockResolvedValue(null);

      await expect(service.archive({ id: 999, userId: 1 })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('delete', () => {
    it('should delete a plan', async () => {
      const mockPlan = { id: 1, userId: 1 };
      mockPrisma.contentPlan.findFirst.mockResolvedValue(mockPlan);
      mockPrisma.contentPlan.delete.mockResolvedValue(mockPlan);

      const result = await service.delete({ id: 1, userId: 1 });
      expect(result).toEqual(mockPlan);
    });

    it('should throw if plan not found', async () => {
      mockPrisma.contentPlan.findFirst.mockResolvedValue(null);

      await expect(service.delete({ id: 999, userId: 1 })).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
