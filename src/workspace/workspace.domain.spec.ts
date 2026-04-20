import { UnauthorizedException } from '@nestjs/common';
import { WorkspaceDomain } from './workspace.domain';

describe('WorkspaceDomain', () => {
  const sessions = {
    findBySessionToken: jest.fn(),
  };
  const workspaceMembers = {
    findByAccountId: jest.fn(),
  };

  let domain: WorkspaceDomain;

  beforeEach(() => {
    jest.clearAllMocks();
    domain = new WorkspaceDomain(sessions as never, workspaceMembers as never);
  });

  it('返回当前工作空间摘要', async () => {
    sessions.findBySessionToken.mockResolvedValue({
      accountId: 1,
      expiredAt: new Date(Date.now() + 60_000),
    });
    workspaceMembers.findByAccountId.mockResolvedValue([
      {
        role: 'owner',
        workspace: {
          id: 101,
          name: '我的空间',
          type: 'personal',
          status: 'active',
        },
      },
    ]);

    const result = await domain.getCurrentWorkspace('session_ok');

    expect(result.id).toBe(101);
    expect(result.role).toBe('owner');
  });

  it('在没有空间成员关系时拒绝访问', async () => {
    sessions.findBySessionToken.mockResolvedValue({
      accountId: 1,
      expiredAt: new Date(Date.now() + 60_000),
    });
    workspaceMembers.findByAccountId.mockResolvedValue([]);

    await expect(domain.listMyWorkspaces('session_ok')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
