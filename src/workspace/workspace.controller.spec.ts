import { WorkspaceController } from './workspace.controller';
import { WorkspaceService } from './workspace.service';

describe('WorkspaceController', () => {
  let controller: WorkspaceController;
  const workspaceService = {
    list: jest.fn(),
    current: jest.fn(),
  };

  beforeAll(() => {
    controller = new WorkspaceController(
      workspaceService as unknown as WorkspaceService,
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('获取工作空间列表应使用 request 中的 sessionToken', async () => {
    workspaceService.list.mockResolvedValue({
      items: [
        {
          id: 101,
          name: '我的空间',
          type: 'personal',
          role: 'owner',
          status: 'active',
        },
      ],
    });

    const req = { sessionToken: 'session_ok' } as any;
    const result = await controller.list(req);

    expect(workspaceService.list).toHaveBeenCalledWith('session_ok');
    expect(result.items).toHaveLength(1);
  });

  it('获取当前工作空间应使用 request 中的 sessionToken', async () => {
    workspaceService.current.mockResolvedValue({
      id: 101,
      name: '我的空间',
      type: 'personal',
      role: 'owner',
      status: 'active',
    });

    const req = { sessionToken: 'session_ok' } as any;
    const result = await controller.current(req);

    expect(workspaceService.current).toHaveBeenCalledWith('session_ok');
    expect(result.role).toBe('owner');
  });
});
