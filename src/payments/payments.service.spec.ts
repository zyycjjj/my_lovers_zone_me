import { PaymentsService } from './payments.service';

describe('PaymentsService', () => {
  const plans = {
    getPlan: jest.fn(),
    getPlanConfig: jest.fn(),
    getEnabledPlans: jest.fn(),
    savePlanConfig: jest.fn(),
  };
  const prisma = {
    paymentOrder: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
    },
    subscription: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    appConfig: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  let service: PaymentsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PaymentsService(plans as never, prisma as never);
  });

  it('creates orders using configured plan price', async () => {
    plans.getPlan.mockResolvedValue({ key: 'pro', priceFen: 1990 });
    prisma.paymentOrder.create.mockImplementation(async ({ data }) => data);

    const order = await service.createOrder({
      userId: 1,
      accountId: 2,
      planKey: 'pro',
    });

    expect(order.amountFen).toBe(1990);
    expect(prisma.paymentOrder.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ planKey: 'pro', amountFen: 1990 }),
      }),
    );
  });

  it('uses configured duration when approving orders', async () => {
    const order = { id: 7, accountId: 2, planKey: 'team' };
    plans.getPlan.mockResolvedValue({ key: 'team', durationDays: null });
    prisma.paymentOrder.findUnique.mockResolvedValue(order);
    prisma.$transaction.mockImplementation(async (handler) =>
      handler({
        paymentOrder: {
          update: jest.fn().mockResolvedValue({ ...order, status: 'activated' }),
        },
        subscription: {
          create: jest.fn().mockImplementation(async ({ data }) => data),
        },
      }),
    );

    const result = await service.approveOrder(7);

    expect(result.subscription.expiredAt).toBeNull();
  });
});
