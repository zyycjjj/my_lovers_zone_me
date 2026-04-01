import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  const authService = {
    getNumberAuthToken: jest.fn(),
    numberLogin: jest.fn(),
    me: jest.fn(),
    routing: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn(),
  };

  beforeAll(() => {
    controller = new AuthController(authService as unknown as AuthService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('号码认证登录应透传 dto 到 service', async () => {
    authService.numberLogin.mockResolvedValue({ ok: true });

    const body = { spToken: 'sp_token_1' };
    const result = await controller.numberLogin(body);

    expect(authService.numberLogin).toHaveBeenCalledWith(body);
    expect(result).toEqual({ ok: true });
  });

  it('获取当前登录态应读取 request 中的 sessionToken', async () => {
    authService.me.mockResolvedValue({ account: { id: 1 } });

    const req = { sessionToken: 'session_ok' } as any;
    const result = await controller.me(req);

    expect(authService.me).toHaveBeenCalledWith('session_ok');
    expect(result).toEqual({ account: { id: 1 } });
  });

  it('刷新会话应同时透传当前 sessionToken 和请求体', async () => {
    authService.refresh.mockResolvedValue({ sessionToken: 'next_session' });

    const req = { sessionToken: 'session_ok' } as any;
    const body = { refreshToken: 'refresh_ok', rotateRefreshToken: true };
    const result = await controller.refresh(req, body);

    expect(authService.refresh).toHaveBeenCalledWith('session_ok', body);
    expect(result).toEqual({ sessionToken: 'next_session' });
  });

  it('退出登录应读取 sessionToken 并透传请求体', async () => {
    authService.logout.mockResolvedValue({ ok: true });

    const req = { sessionToken: 'session_ok' } as any;
    const body = { allDevices: false };
    const result = await controller.logout(req, body);

    expect(authService.logout).toHaveBeenCalledWith('session_ok', body);
    expect(result).toEqual({ ok: true });
  });
});
