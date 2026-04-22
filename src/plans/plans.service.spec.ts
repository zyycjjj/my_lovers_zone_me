import { PlansService } from './plans.service';

describe('PlansService', () => {
  const prisma = {
    appConfig: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  };

  let service: PlansService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PlansService(prisma as never);
  });

  it('returns default V3.5 plans when config is missing', async () => {
    prisma.appConfig.findUnique.mockResolvedValue(null);

    const result = await service.getPlanConfig();

    expect(result.plans).toHaveLength(3);
    expect(result.plans[0]).toMatchObject({
      key: 'experience',
      priceFen: 100,
      quotaLimit: 3,
      quotaWindow: 'total',
    });
    expect(result.plans[1]).toMatchObject({
      key: 'pro',
      priceFen: 990,
      quotaLimit: 10,
      quotaWindow: 'daily',
    });
    expect(result.plans[2]).toMatchObject({
      key: 'team',
      priceFen: 6600,
      durationDays: null,
    });
  });

  it('saves normalized plan config and keeps fallback fields', async () => {
    prisma.appConfig.upsert.mockResolvedValue({});

    const result = await service.savePlanConfig({
      plans: [
        {
          key: 'pro',
          name: '月卡',
          priceFen: 1990,
          quotaLimit: 20,
          quotaWindow: 'daily',
          features: ['每日20条'],
        },
      ],
    });

    const pro = result.plans.find((plan) => plan.key === 'pro');
    expect(pro).toMatchObject({
      name: '月卡',
      priceFen: 1990,
      quotaLimit: 20,
      quotaWindow: 'daily',
    });
    expect(pro?.suffix).toBe('/月');
    expect(prisma.appConfig.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { key: 'plan_config' },
      }),
    );
  });
});
