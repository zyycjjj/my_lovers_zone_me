import { UnauthorizedException } from '@nestjs/common';
import { AuthDomain } from './auth.domain';

describe('AuthDomain', () => {
  const prisma = {
    $transaction: jest.fn(),
  };
  const aliyun = {
    getAuthToken: jest.fn(),
    getPhoneWithToken: jest.fn(),
  };
  const accounts = {
    findByPhone: jest.fn(),
    createByPhone: jest.fn(),
    findById: jest.fn(),
    updateDisplayName: jest.fn(),
  };
  const identities = {
    findByProviderPhone: jest.fn(),
    createPrimaryIdentity: jest.fn(),
  };
  const sessions = {
    create: jest.fn(),
    findBySessionToken: jest.fn(),
    findByRefreshToken: jest.fn(),
    updateTokens: jest.fn(),
    deleteBySessionToken: jest.fn(),
    deleteByAccountId: jest.fn(),
    touch: jest.fn(),
  };
  const sessionAccounts = {
    findSessionBundle: jest.fn(),
  };
  const workspaces = {
    findPersonalOwnedByAccountId: jest.fn(),
    createPersonalWorkspace: jest.fn(),
  };
  const workspaceMembers = {
    upsertOwnerMember: jest.fn(),
    findByAccountId: jest.fn(),
  };
  const profiles = {
    findByAccountId: jest.fn(),
  };

  let domain: AuthDomain;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation(async (handler: Function) => handler({}));
    domain = new AuthDomain(
      prisma as never,
      aliyun as never,
      accounts as never,
      identities as never,
      sessions as never,
      sessionAccounts as never,
      workspaces as never,
      workspaceMembers as never,
      profiles as never,
    );
  });

  it('为新手机号自动创建账号、空间和会话', async () => {
    aliyun.getPhoneWithToken.mockResolvedValue({ phone: '13800138000' });
    accounts.findByPhone.mockResolvedValue(null);
    accounts.createByPhone.mockResolvedValue({
      id: 1,
      phone: '13800138000',
      displayName: null,
      status: 'active',
    });
    identities.findByProviderPhone.mockResolvedValue(null);
    workspaces.findPersonalOwnedByAccountId.mockResolvedValue(null);
    workspaces.createPersonalWorkspace.mockResolvedValue({
      id: 101,
      name: '我的空间',
      type: 'personal',
      status: 'active',
    });
    sessions.create.mockResolvedValue({
      id: 201,
      sessionToken: 'session_1',
      refreshToken: 'refresh_1',
      expiredAt: new Date('2026-04-08T00:00:00.000Z'),
    });
    profiles.findByAccountId.mockResolvedValue(null);
    workspaceMembers.findByAccountId.mockResolvedValue([
      {
        workspaceId: 101,
        role: 'owner',
        workspace: {
          id: 101,
          name: '我的空间',
          type: 'personal',
          status: 'active',
        },
      },
    ]);

    const result = await domain.numberLogin({ spToken: 'sp_token_1' });

    expect(accounts.createByPhone).toHaveBeenCalledWith('13800138000', {});
    expect(identities.createPrimaryIdentity).toHaveBeenCalled();
    expect(workspaces.createPersonalWorkspace).toHaveBeenCalledWith(1, '我的空间', {});
    expect(workspaceMembers.upsertOwnerMember).toHaveBeenCalledWith(101, 1, {});
    expect(result.account.phone).toBe('13800138000');
    expect(result.routing.routeType).toBe('onboarding');
  });

  it('在已完成建档时返回工作空间首页分流', async () => {
    sessionAccounts.findSessionBundle.mockResolvedValue({
      id: 1,
      accountId: 1,
      expiredAt: new Date(Date.now() + 60_000),
      account: {
        id: 1,
        phone: '13800138000',
        displayName: '小杨',
        status: 'active',
      },
    });
    sessions.touch.mockResolvedValue(undefined);
    workspaceMembers.findByAccountId.mockResolvedValue([
      {
        workspaceId: 101,
        role: 'owner',
        workspace: {
          id: 101,
          name: '小杨的空间',
          type: 'personal',
          status: 'active',
        },
      },
    ]);
    profiles.findByAccountId.mockResolvedValue({
      onboardingCompletedAt: new Date(),
    });

    const result = await domain.getRouting('session_ok');

    expect(result.routeType).toBe('workspace_home');
    expect(result.workspaceId).toBe(101);
  });

  it('在 session 不存在时拒绝刷新', async () => {
    sessions.findBySessionToken.mockResolvedValue(null);
    sessions.findByRefreshToken.mockResolvedValue(null);

    await expect(
      domain.refreshSession('missing', { refreshToken: 'missing' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
