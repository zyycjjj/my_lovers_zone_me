import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UserGuard } from '../auth/guards/user.guard';
import { PrismaService } from '../prisma/prisma.service';
import { EventService } from '../event/event.service';
import { ContentAssetsController } from './content-assets.controller';
import { ContentAssetsService } from './content-assets.service';

const mockContentAssets = [
  {
    id: 1,
    userId: 10,
    accountId: 100,
    workspaceId: 1,
    toolKey: 'title',
    title: '测试标题',
    content: '生成的内容文本',
    sourcePrompt: '测试关键词',
    status: 'saved' as const,
    completedAt: null,
    createdAt: new Date('2026-04-29T10:00:00.000Z'),
    updatedAt: new Date('2026-04-29T10:00:00.000Z'),
  },
  {
    id: 2,
    userId: 10,
    accountId: 100,
    workspaceId: 1,
    toolKey: 'script',
    title: '脚本内容',
    content: '生成的脚本文本',
    sourcePrompt: '商品关键词',
    status: 'completed' as const,
    completedAt: new Date('2026-04-28T15:00:00.000Z'),
    createdAt: new Date('2026-04-28T14:00:00.000Z'),
    updatedAt: new Date('2026-04-28T14:00:00.000Z'),
  },
];

const mockPrisma = {
  contentAsset: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    delete: jest.fn(),
  },
  workspaceMember: {
    findFirst: jest.fn().mockResolvedValue({ workspaceId: 1 }),
  },
};

const mockEvents = {
  recordEvent: jest.fn().mockResolvedValue(undefined),
};

describe('ContentAssetsService', () => {
  let service: ContentAssetsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ContentAssetsService(
      mockPrisma as unknown as PrismaService,
      mockEvents as unknown as EventService,
    );
  });

  describe('create', () => {
    it('should create a saved content asset', async () => {
      mockPrisma.contentAsset.create.mockResolvedValue(mockContentAssets[0]);
      mockPrisma.contentAsset.findFirst.mockResolvedValue({ workspaceId: 1 });

      const result = await service.create({
        userId: 10,
        accountId: 100,
        toolKey: 'title',
        title: '测试标题',
        content: '生成的内容文本',
        sourcePrompt: '关键词',
        markCompleted: false,
      });

      expect(mockPrisma.contentAsset.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 10,
            accountId: 100,
            toolKey: 'title',
            title: '测试标题',
            content: '生成的内容文本',
            status: 'saved',
          }),
        }),
      );
      expect(result).toEqual(mockContentAssets[0]);
      expect(mockEvents.recordEvent).toHaveBeenCalledWith(10, 'button_used', 'content.saved', expect.any(String));
    });

    it('should throw BadRequestException when content is empty', async () => {
      await expect(
        service.create({
          userId: 10,
          toolKey: 'title',
          content: '   ',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('listMine', () => {
    it('should return paginated assets filtered by userId', async () => {
      mockPrisma.contentAsset.findMany.mockResolvedValue(mockContentAssets);
      mockPrisma.contentAsset.count.mockResolvedValue(2);

      const result = await service.listMine({ userId: 10, limit: 20 });

      expect(mockPrisma.contentAsset.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 10 },
          orderBy: { createdAt: 'desc' },
          take: 20,
          skip: 0,
        }),
      );
      expect(result.items).toEqual(mockContentAssets);
      expect(result.total).toBe(2);
    });

    it('should support skip/offset for pagination', async () => {
      mockPrisma.contentAsset.findMany.mockResolvedValue([mockContentAssets[1]]);
      mockPrisma.contentAsset.count.mockResolvedValue(3);

      const result = await service.listMine({ userId: 10, limit: 1, skip: 1 });

      expect(result.items.length).toBe(1);
      expect(result.offset).toBe(1);
    });

    it('should filter by date when provided', async () => {
      mockPrisma.contentAsset.findMany.mockResolvedValue([mockContentAssets[0]]);
      mockPrisma.contentAsset.count.mockResolvedValue(1);

      await service.listMine({ userId: 10, date: '2026-04-29' });

      expect(mockPrisma.contentAsset.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({
              gte: expect.any(Date),
              lt: expect.any(Date),
            }),
          }),
        }),
      );
    });

    it('should filter by status when provided', async () => {
      mockPrisma.contentAsset.findMany.mockResolvedValue([mockContentAssets[1]]);
      mockPrisma.contentAsset.count.mockResolvedValue(1);

      await service.listMine({ userId: 10, status: 'completed' });

      expect(mockPrisma.contentAsset.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'completed' }),
        }),
      );
    });

    it('should use OR condition when accountId is provided', async () => {
      mockPrisma.contentAsset.findMany.mockResolvedValue(mockContentAssets);
      mockPrisma.contentAsset.count.mockResolvedValue(2);

      await service.listMine({ userId: 10, accountId: 100 });

      const calledWhere = mockPrisma.contentAsset.findMany.mock.calls[0][0].where;
      expect(calledWhere).toHaveProperty('OR');
    });

    it('should clamp limit between 1 and 100', async () => {
      mockPrisma.contentAsset.findMany.mockResolvedValue([]);
      mockPrisma.contentAsset.count.mockResolvedValue(0);

      await service.listMine({ userId: 10, limit: 200 });
      expect(mockPrisma.contentAsset.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 100 }));

      await service.listMine({ userId: 10, limit: 0 });
      expect(mockPrisma.contentAsset.findMany).toHaveBeenLastCalledWith(expect.objectContaining({ take: 1 }));
    });
  });

  describe('getStats', () => {
    it('should return aggregated stats', async () => {
      mockPrisma.contentAsset.count
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(4);
      mockPrisma.contentAsset.findFirst.mockResolvedValue(mockContentAssets[0]);

      const result = await service.getStats({ userId: 10 });

      expect(result).toEqual({
        totalSaved: 5,
        totalCompleted: 3,
        totalAll: 8,
        todayCreated: 2,
        yesterdayCreated: 4,
        latestAsset: expect.objectContaining({ id: 1, toolKey: 'title' }),
      });
      expect(mockPrisma.contentAsset.count).toHaveBeenCalledTimes(4);
    });

    it('should use OR condition for accountId', async () => {
      mockPrisma.contentAsset.count.mockResolvedValue(0);
      mockPrisma.contentAsset.findFirst.mockResolvedValue(null);

      await service.getStats({ userId: 10, accountId: 100 });

      const lastCallWhere = mockPrisma.contentAsset.count.mock.calls[3][0].where;
      expect(lastCallWhere).toHaveProperty('OR');
    });
  });

  describe('markCompleted', () => {
    it('should mark asset as completed', async () => {
      mockPrisma.contentAsset.findFirst.mockResolvedValue(mockContentAssets[0]);
      mockPrisma.contentAsset.update.mockResolvedValue({
        ...mockContentAssets[0],
        status: 'completed',
        completedAt: expect.any(Date),
      });

      const result = await service.markCompleted({ id: 1, userId: 10, accountId: 100 });

      expect(mockPrisma.contentAsset.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: 'completed', completedAt: expect.any(Date) },
      });
      expect(result.status).toBe('completed');
    });

    it('should throw NotFoundException when asset not found', async () => {
      mockPrisma.contentAsset.findFirst.mockResolvedValue(null);

      await expect(service.markCompleted({ id: 999, userId: 10 })).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete an existing asset', async () => {
      mockPrisma.contentAsset.findFirst.mockResolvedValue({ id: 1 });
      mockPrisma.contentAsset.delete.mockResolvedValue({ id: 1 } as never);

      const result = await service.remove({ id: 1, userId: 10 });

      expect(mockPrisma.contentAsset.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should throw NotFoundException when asset not found', async () => {
      mockPrisma.contentAsset.findFirst.mockResolvedValue(null);

      await expect(service.remove({ id: 999, userId: 10 })).rejects.toThrow(NotFoundException);
    });
  });
});

describe('ContentAssetsController', () => {
  let controller: ContentAssetsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContentAssetsController],
      providers: [
        ContentAssetsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventService, useValue: mockEvents },
      ],
    })
      .overrideGuard(UserGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ContentAssetsController>(ContentAssetsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
