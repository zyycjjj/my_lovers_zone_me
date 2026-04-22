import { ForbiddenException } from '@nestjs/common';
import { EntitlementsService } from './entitlements.service';

describe('EntitlementsService', () => {
  const plans = {
    getPlan: jest.fn(),
  };
  const prisma = {
    subscription: {
      findFirst: jest.fn(),
    },
    event: {
      aggregate: jest.fn(),
    },
  };

  let service: EntitlementsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new EntitlementsService(plans as never, prisma as never);
  });

  it('blocks billable tools when no active subscription exists', async () => {
    prisma.subscription.findFirst.mockResolvedValue(null);

    await expect(
      service.assertCanUseTool({
        userId: 1,
        accountId: 1,
        toolKey: 'script',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('returns remaining quota from configured plan and usage events', async () => {
    prisma.subscription.findFirst.mockResolvedValue({
      id: 1,
      planKey: 'pro',
      status: 'active',
    });
    plans.getPlan.mockResolvedValue({
      key: 'pro',
      name: '月卡',
      quotaLimit: 10,
      quotaWindow: 'daily',
    });
    prisma.event.aggregate.mockResolvedValue({ _sum: { count: 4 } });

    const status = await service.getStatus({ userId: 1, accountId: 1 });

    expect(status).toMatchObject({
      active: true,
      planKey: 'pro',
      planLabel: '月卡',
      limit: 10,
      used: 4,
      remaining: 6,
    });
  });

  it('does not check non billable tools', async () => {
    await expect(
      service.assertCanUseTool({
        userId: 1,
        accountId: undefined,
        toolKey: 'commission',
      }),
    ).resolves.toBeNull();
    expect(prisma.subscription.findFirst).not.toHaveBeenCalled();
  });
});
