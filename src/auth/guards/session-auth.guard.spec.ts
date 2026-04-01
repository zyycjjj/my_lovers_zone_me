import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { SessionAuthGuard } from './session-auth.guard';

describe('SessionAuthGuard', () => {
  const sessions = {
    findBySessionToken: jest.fn(),
    touch: jest.fn(),
  };
  const workspaceMembers = {
    findByAccountId: jest.fn(),
  };

  let guard: SessionAuthGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new SessionAuthGuard(
      sessions as never,
      workspaceMembers as never,
    );
  });

  const createContext = (req: Record<string, unknown>) =>
    ({
      switchToHttp: () => ({
        getRequest: () => req,
      }),
    }) as ExecutionContext;

  it('在 session 有效时写入请求上下文', async () => {
    const req = {
      header: (name: string) => (name === 'x-session-token' ? 'session_ok' : undefined),
      cookies: {},
    };
    sessions.findBySessionToken.mockResolvedValue({
      id: 1,
      accountId: 10,
      expiredAt: new Date(Date.now() + 60_000),
    });
    sessions.touch.mockResolvedValue(undefined);
    workspaceMembers.findByAccountId.mockResolvedValue([{ workspaceId: 101 }]);

    const result = await guard.canActivate(createContext(req));

    expect(result).toBe(true);
    expect((req as any).sessionToken).toBe('session_ok');
    expect((req as any).accountId).toBe(10);
    expect((req as any).workspaceId).toBe(101);
  });

  it('在 session 缺失时拒绝访问', async () => {
    const req = {
      header: () => undefined,
      cookies: {},
    };

    await expect(guard.canActivate(createContext(req))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
