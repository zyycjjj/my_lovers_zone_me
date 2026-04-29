import { QuotaUsageService } from './quota-usage.service';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  quotaUsage: {
    create: jest.fn(),
    findMany: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
    count: jest.fn(),
  },
};

describe('QuotaUsageService', () => {
  let service: QuotaUsageService;

  beforeEach(() => {
    Object.values(mockPrisma).forEach((obj: any) => {
      Object.keys(obj).forEach((key) => {
        if (typeof obj[key] === 'function') obj[key].mockReset();
      });
    });

    service = new QuotaUsageService(mockPrisma as unknown as PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('record', () => {
    it('should record a usage event with defaults', async () => {
      const mockRecord = { id: 1, amount: 1 };
      mockPrisma.quotaUsage.create.mockResolvedValue(mockRecord);

      const result = await service.record({
        userId: 1,
        planKey: 'pro',
        quotaKey: 'text_generation',
      });

      expect(result).toEqual(mockRecord);
      expect(mockPrisma.quotaUsage.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 1,
          planKey: 'pro',
          quotaKey: 'text_generation',
          amount: 1,
        }),
      });
    });

    it('should record with custom amount and metadata', async () => {
      const mockRecord = { id: 1, amount: 5, description: '批量生成脚本' };
      mockPrisma.quotaUsage.create.mockResolvedValue(mockRecord);

      await service.record({
        userId: 1,
        accountId: 2,
        planKey: 'team',
        quotaKey: 'script_generation',
        amount: 5,
        description: '批量生成脚本',
        refType: 'content_asset',
        refId: 42,
        balanceAfter: 15,
      });

      expect(mockPrisma.quotaUsage.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          accountId: 2,
          amount: 5,
          description: '批量生成脚本',
          refType: 'content_asset',
          refId: 42,
          balanceAfter: 15,
        }),
      });
    });
  });

  describe('listMine', () => {
    it('should return paginated usage records', async () => {
      const mockItems = [{ id: 1 }, { id: 2 }];
      mockPrisma.quotaUsage.findMany.mockResolvedValue(mockItems);
      mockPrisma.quotaUsage.count.mockResolvedValue(2);

      const result = await service.listMine({ userId: 1 });
      expect(result.items).toEqual(mockItems);
      expect(result.total).toBe(2);
      expect(result.limit).toBe(20);
      expect(result.offset).toBe(0);
    });

    it('should filter by quotaKey', async () => {
      mockPrisma.quotaUsage.findMany.mockResolvedValue([]);
      mockPrisma.quotaUsage.count.mockResolvedValue(0);

      await service.listMine({ userId: 1, quotaKey: 'script_generation' });
      expect(mockPrisma.quotaUsage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ quotaKey: 'script_generation' }),
        }),
      );
    });

    it('should filter by date range', async () => {
      mockPrisma.quotaUsage.findMany.mockResolvedValue([]);
      mockPrisma.quotaUsage.count.mockResolvedValue(0);

      await service.listMine({
        userId: 1,
        startDate: '2026-04-01',
        endDate: '2026-04-30',
      });

      const callArgs = mockPrisma.quotaUsage.findMany.mock.calls[0][0];
      expect(callArgs.where.createdAt).toBeDefined();
    });

    it('should clamp limit values', async () => {
      mockPrisma.quotaUsage.findMany.mockResolvedValue([]);
      mockPrisma.quotaUsage.count.mockResolvedValue(0);

      const result = await service.listMine({ userId: 1, limit: 500 });
      expect(result.limit).toBe(100);

      const result2 = await service.listMine({ userId: 1, limit: 0 });
      expect(result2.limit).toBe(1);
    });
  });

  describe('getSummary', () => {
    it('should return usage summary with breakdown', async () => {
      mockPrisma.quotaUsage.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 3 }, _count: 3 }) // today
        .mockResolvedValueOnce({ _sum: { amount: 12 }, _count: 12 }) // week
        .mockResolvedValueOnce({ _sum: { amount: 45 }, _count: 45 }); // all

      mockPrisma.quotaUsage.groupBy.mockResolvedValue([
        { quotaKey: 'title_generation', _sum: { amount: 15 } },
        { quotaKey: 'script_generation', _sum: { amount: 20 } },
        { quotaKey: 'refine', _sum: { amount: 10 } },
      ]);

      const result = await service.getSummary({ userId: 1 });

      expect(result.todayUsed).toBe(3);
      expect(result.todayCount).toBe(3);
      expect(result.weekUsed).toBe(12);
      expect(result.weekCount).toBe(12);
      expect(result.totalUsed).toBe(45);
      expect(result.totalCount).toBe(45);
      expect(result.breakdown).toHaveLength(3);
      expect(result.breakdown).toContainEqual({
        quotaKey: 'script_generation',
        used: 20,
      });
    });

    it('should handle zero usage gracefully', async () => {
      mockPrisma.quotaUsage.aggregate
        .mockResolvedValueOnce({ _sum: { amount: null }, _count: 0 })
        .mockResolvedValueOnce({ _sum: { amount: null }, _count: 0 })
        .mockResolvedValueOnce({ _sum: { amount: null }, _count: 0 });

      mockPrisma.quotaUsage.groupBy.mockResolvedValue([]);

      const result = await service.getSummary({ userId: 1 });

      expect(result.todayUsed).toBe(0);
      expect(result.weekUsed).toBe(0);
      expect(result.totalUsed).toBe(0);
      expect(result.breakdown).toHaveLength(0);
    });

    it('should filter by accountId when provided', async () => {
      mockPrisma.quotaUsage.aggregate
        .mockResolvedValue({ _sum: { amount: 0 }, _count: 0 })
        .mockResolvedValue({ _sum: { amount: 0 }, _count: 0 })
        .mockResolvedValue({ _sum: { amount: 0 }, _count: 0 });
      mockPrisma.quotaUsage.groupBy.mockResolvedValue([]);

      await service.getSummary({ userId: 1, accountId: 2 });

      const calls = mockPrisma.quotaUsage.aggregate.mock.calls;
      calls.forEach((call) => {
        expect(call[0].where.accountId).toBe(2);
      });
    });
  });
});
