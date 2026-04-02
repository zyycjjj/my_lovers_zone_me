import { UnauthorizedException } from '@nestjs/common';
import { OnboardingDomain } from './onboarding.domain';

describe('OnboardingDomain', () => {
  const prisma = {
    $transaction: jest.fn(),
  };
  const sessions = {
    findBySessionToken: jest.fn(),
  };
  const accounts = {
    findById: jest.fn(),
    updateDisplayName: jest.fn(),
  };
  const profiles = {
    findByAccountId: jest.fn(),
    upsertByAccountId: jest.fn(),
  };
  const workspaceMembers = {
    findByAccountId: jest.fn(),
  };
  const workspaces = {
    findById: jest.fn(),
  };

  let domain: OnboardingDomain;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation(async (handler: Function) =>
      handler({
        workspace: {
          update: jest.fn(),
        },
      }),
    );
    domain = new OnboardingDomain(
      prisma as never,
      sessions as never,
      accounts as never,
      profiles as never,
      workspaceMembers as never,
      workspaces as never,
    );
  });

  const mockSessionContext = () => {
    sessions.findBySessionToken.mockResolvedValue({
      accountId: 1,
      expiredAt: new Date(Date.now() + 60_000),
    });
    accounts.findById.mockResolvedValue({ id: 1, displayName: null });
    workspaceMembers.findByAccountId.mockResolvedValue([{ workspaceId: 101 }]);
    workspaces.findById.mockResolvedValue({ id: 101, name: '我的空间' });
  };

  it('在未建档时返回 onboarding 状态', async () => {
    mockSessionContext();
    profiles.findByAccountId.mockResolvedValue(null);

    const result = await domain.getStatus('session_ok');

    expect(result.completed).toBe(false);
    expect(result.profileExists).toBe(false);
    expect(result.nextStep).toBe('onboarding');
  });

  it('提交建档后返回 workspace_home 分流', async () => {
    mockSessionContext();
    profiles.findByAccountId.mockResolvedValue(null);
    accounts.updateDisplayName.mockResolvedValue({ id: 1 });
    profiles.upsertByAccountId.mockResolvedValue({
      id: 9,
      accountId: 1,
      workspaceId: 101,
      nickname: '小杨',
      businessRole: '个体商家',
      industry: '家居百货',
      currentGoal: '先稳定每天发一条',
      contentDirection: '短视频带货',
      targetPlatform: '抖音',
      experienceLevel: 'beginner',
      onboardingCompletedAt: new Date('2026-04-01T10:00:00.000Z'),
    });

    const result = await domain.upsertProfile('session_ok', {
      nickname: '小杨',
      businessRole: '个体商家',
      industry: '家居百货',
      currentGoal: '先稳定每天发一条',
      contentDirection: '短视频带货',
      targetPlatform: '抖音',
      experienceLevel: 'beginner',
    });

    expect(accounts.updateDisplayName).toHaveBeenCalledWith(1, '小杨', expect.any(Object));
    expect(result.profile.nickname).toBe('小杨');
    expect(result.profile.businessRole).toBe('个体商家');
    expect(result.profile.currentGoal).toBe('先稳定每天发一条');
    expect(result.routing.routeType).toBe('workspace_home');
  });

  it('在 session 失效时拒绝获取状态', async () => {
    sessions.findBySessionToken.mockResolvedValue(null);

    await expect(domain.getStatus('missing')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
