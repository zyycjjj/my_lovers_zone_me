import { CheckinsService, MoodType } from './checkins.service';

describe('CheckinsService', () => {
  let service: CheckinsService;
  const mockPrisma = {
    dailyCheckin: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    contentAsset: {
      findMany: jest.fn(),
    },
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CheckinsService(mockPrisma);
  });

  describe('checkIn', () => {
    it('should create a new checkin when none exists for today', async () => {
      mockPrisma.dailyCheckin.findUnique.mockResolvedValue(null);
      const mockCreated = { id: 1, userId: 1, date: '2026-04-29', mood: 'energized', goalKey: 'publish' };
      mockPrisma.dailyCheckin.create.mockResolvedValue(mockCreated);

      const result = await service.checkIn(1, { mood: 'energized' as MoodType, goalKey: 'publish' });

      expect(mockPrisma.dailyCheckin.create).toHaveBeenCalledWith({
        data: { userId: 1, date: expect.any(String), mood: 'energized', goalKey: 'publish', sourceHint: undefined },
      });
      expect(result).toEqual(mockCreated);
    });

    it('should update existing checkin when already checked in today', async () => {
      const existing = { id: 1, userId: 1, date: '2026-04-29', mood: 'energized', goalKey: 'publish' };
      mockPrisma.dailyCheckin.findUnique.mockResolvedValue(existing);
      const mockUpdated = { ...existing, mood: 'tired', goalKey: 'convert' };
      mockPrisma.dailyCheckin.update.mockResolvedValue(mockUpdated);

      const result = await service.checkIn(1, { mood: 'tired' as MoodType, goalKey: 'convert' });

      expect(mockPrisma.dailyCheckin.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { mood: 'tired', goalKey: 'convert', sourceHint: undefined },
      });
      expect(result).toEqual(mockUpdated);
    });

    it('should preserve existing goalKey if not provided during update', async () => {
      const existing = { id: 1, userId: 1, date: '2026-04-29', mood: 'energized', goalKey: 'publish' };
      mockPrisma.dailyCheckin.findUnique.mockResolvedValue(existing);
      mockPrisma.dailyCheckin.update.mockResolvedValue({ ...existing, mood: 'rushed' });

      await service.checkIn(1, { mood: 'rushed' as MoodType });

      expect(mockPrisma.dailyCheckin.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { mood: 'rushed', goalKey: 'publish', sourceHint: undefined },
      });
    });
  });

  describe('getTodayCheckin', () => {
    it('should return null when no checkin exists', async () => {
      mockPrisma.dailyCheckin.findUnique.mockResolvedValue(null);

      const result = await service.getTodayCheckin(1);

      expect(result).toBeNull();
    });

    it('should return today checkin when exists', async () => {
      const mockCheckin = { id: 1, userId: 1, date: '2026-04-29', mood: 'energized' };
      mockPrisma.dailyCheckin.findUnique.mockResolvedValue(mockCheckin);

      const result = await service.getTodayCheckin(1);

      expect(result).toEqual(mockCheckin);
    });
  });

  describe('getRecentCheckins', () => {
    it('should return recent checkins ordered by date desc', async () => {
      const mockData = [
        { date: '2026-04-29', mood: 'energized' },
        { date: '2026-04-28', mood: 'rushed' },
      ];
      mockPrisma.dailyCheckin.findMany.mockResolvedValue(mockData as any);

      const result = await service.getRecentCheckins(1, 7);

      expect(mockPrisma.dailyCheckin.findMany).toHaveBeenCalledWith({
        where: { userId: 1, date: { gte: expect.any(String) } },
        orderBy: { date: 'desc' },
      });
      expect(result).toEqual(mockData);
    });
  });

  describe('getStreakCount', () => {
    it('should return 0 when no checkins exist', async () => {
      mockPrisma.dailyCheckin.findMany.mockResolvedValue([]);

      const result = await service.getStreakCount(1);

      expect(result).toBe(0);
    });

    it('should count consecutive days correctly with today checkin', async () => {
      const today = new Date().toISOString().slice(0, 10);
      mockPrisma.dailyCheckin.findMany.mockResolvedValue([
        { date: today },
        { date: '2026-04-28' },
        { date: '2026-04-27' },
        { date: '2026-04-26' }, // gap here
        { date: '2026-04-20' },
      ] as any);

      const result = await service.getStreakCount(1);

      expect(result).toBe(4); // today + 3 previous consecutive days
    });

    it('should return 0 when no recent checkin (gap > 1 day)', async () => {
      mockPrisma.dailyCheckin.findMany.mockResolvedValue([
        { date: '2026-04-27' },
        { date: '2026-04-26' },
      ] as any);

      const result = await service.getStreakCount(1);

      // yesterday is 2026-04-28 or similar, last checkin was 2+ days ago
      expect(result).toBe(0);
    });
  });

  describe('buildCheckinPanelData', () => {
    it('should return panel data with continue hint based on yesterday assets and goal', async () => {
      const today = new Date().toISOString().slice(0, 10);
      const yesterday = (() => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().slice(0, 10); })();

      mockPrisma.dailyCheckin.findUnique
        .mockResolvedValueOnce(null) // todayCheckin
        .mockResolvedValueOnce({ mood: 'energized', goalKey: 'publish' }); // yesterday

      mockPrisma.contentAsset.findMany.mockResolvedValue([
        { id: 1, title: '春季上新标题', toolKey: 'title', createdAt: `${yesterday}T12:00:00Z` },
      ] as any);

      mockPrisma.dailyCheckin.findMany.mockResolvedValue([{ date: today }, { date: yesterday }] as any);

      const result = await service.buildCheckinPanelData(1);

      expect(result.todayCheckin).toBeNull();
      expect(result.continueHint).toContain('昨天你完成了');
      expect(result.streak).toBeGreaterThanOrEqual(1);
      expect(result.moodHints).toBeDefined();
      expect(result.moodLabels).toBeDefined();
    });

    it('should return null continueHint for first-time users', async () => {
      mockPrisma.dailyCheckin.findUnique
        .mockResolvedValueOnce(null) // todayCheckin
        .mockResolvedValueOnce(null); // yesterday

      mockPrisma.contentAsset.findMany.mockResolvedValue([]);
      mockPrisma.dailyCheckin.findMany.mockResolvedValue([]);

      const result = await service.buildCheckinPanelData(1);

      expect(result.continueHint).toBeNull();
    });

    it('should show generic hint when yesterday has no assets but has checkin', async () => {
      mockPrisma.dailyCheckin.findUnique
        .mockResolvedValueOnce(null) // todayCheckin
        .mockResolvedValueOnce({ mood: 'rushed', goalKey: 'convert' }); // yesterday

      mockPrisma.contentAsset.findMany.mockResolvedValue([]);
      mockPrisma.dailyCheckin.findMany.mockResolvedValue([] as any);

      const result = await service.buildCheckinPanelData(1);

      expect(result.continueHint).toContain('已开工');
    });

    it('should include correct mood labels and hints for all moods', async () => {
      mockPrisma.dailyCheckin.findUnique.mockResolvedValue(null);
      mockPrisma.contentAsset.findMany.mockResolvedValue([]);

      const result = await service.buildCheckinPanelData(1);

      expect(result.moodLabels.energized).toBe('有状态');
      expect(result.moodLabels.rushed).toBe('赶时间');
      expect(result.moodLabels.unsure).toBe('找灵感');
      expect(result.moodLabels.tired).toBe('先试试');

      expect(result.moodHints.energized).toContain('有状态');
      expect(result.moodHints.rushed).toContain('时间紧');
      expect(result.moodHints.unsure).toContain('不确定');
      expect(result.moodHints.tired).toContain('累了');
    });
  });
});
