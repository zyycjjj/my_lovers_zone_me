import type { CallHandler, ExecutionContext } from '@nestjs/common';
import { lastValueFrom, of } from 'rxjs';
import { ApiResponseInterceptor } from './api-response.interceptor';

describe('ApiResponseInterceptor', () => {
  it('应将业务结果包装为统一成功结构', async () => {
    const interceptor = new ApiResponseInterceptor();
    const req = {
      header: jest.fn().mockReturnValue(undefined),
    };
    const context = {
      switchToHttp: () => ({
        getRequest: () => req,
      }),
    } as ExecutionContext;
    const next: CallHandler = {
      handle: () => of({ account: { id: 1 } }),
    };

    const result = await lastValueFrom(interceptor.intercept(context, next));

    expect(result).toMatchObject({
      code: 'SUCCESS',
      message: '请求成功',
      data: { account: { id: 1 } },
    });
    expect((result as any).requestId).toMatch(/^req_/);
    expect((result as any).timestamp).toBeTruthy();
  });
});
