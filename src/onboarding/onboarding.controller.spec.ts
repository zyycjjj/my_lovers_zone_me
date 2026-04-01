import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';

describe('OnboardingController', () => {
  let controller: OnboardingController;
  const onboardingService = {
    status: jest.fn(),
    upsertProfile: jest.fn(),
  };

  beforeAll(() => {
    controller = new OnboardingController(
      onboardingService as unknown as OnboardingService,
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('获取建档状态应使用 request 中的 sessionToken', async () => {
    onboardingService.status.mockResolvedValue({
      completed: false,
      profileExists: false,
      workspaceId: 101,
      nextStep: 'onboarding',
    });

    const req = { sessionToken: 'session_ok' } as any;
    const result = await controller.status(req);

    expect(onboardingService.status).toHaveBeenCalledWith('session_ok');
    expect(result.workspaceId).toBe(101);
  });

  it('提交建档资料应透传 sessionToken 和 body', async () => {
    onboardingService.upsertProfile.mockResolvedValue({
      profile: { nickname: '小杨' },
      routing: { routeType: 'workspace_home' },
    });

    const req = { sessionToken: 'session_ok' } as any;
    const body = { nickname: '小杨', targetPlatform: '抖音' };
    const result = await controller.upsertProfile(req, body);

    expect(onboardingService.upsertProfile).toHaveBeenCalledWith(
      'session_ok',
      body,
    );
    expect(result.profile.nickname).toBe('小杨');
  });
});
