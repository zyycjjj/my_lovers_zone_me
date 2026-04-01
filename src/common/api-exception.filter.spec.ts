import {
  BadRequestException,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { NumberLoginDto } from '../auth/dto/request/number-login.dto';
import { ApiExceptionFilter } from './api-exception.filter';

describe('ApiExceptionFilter', () => {
  const createResponse = () => {
    const payload: { statusCode?: number; body?: unknown } = {};
    return {
      payload,
      response: {
        status: jest.fn().mockImplementation((statusCode: number) => {
          payload.statusCode = statusCode;
          return {
            json: jest.fn().mockImplementation((body: unknown) => {
              payload.body = body;
            }),
          };
        }),
      },
    };
  };

  const createHost = (req: Record<string, unknown>, response: unknown) =>
    ({
      switchToHttp: () => ({
        getRequest: () => req,
        getResponse: () => response,
      }),
    }) as any;

  it('应将校验异常转换为统一错误结构', async () => {
    const pipe = new ValidationPipe({ whitelist: true, transform: true });
    let exception: unknown;

    try {
      await pipe.transform(
        {},
        {
          type: 'body',
          metatype: NumberLoginDto,
        },
      );
    } catch (error) {
      exception = error;
    }

    const filter = new ApiExceptionFilter();
    const req = {
      header: jest.fn().mockReturnValue(undefined),
    };
    const { payload, response } = createResponse();

    filter.catch(exception, createHost(req, response));

    expect(payload.statusCode).toBe(400);
    expect(payload.body).toMatchObject({
      code: 'VALIDATION_ERROR',
    });
    expect((payload.body as any).requestId).toMatch(/^req_/);
    expect(Array.isArray((payload.body as any).details)).toBe(true);
  });

  it('应将未授权异常转换为统一错误结构', () => {
    const filter = new ApiExceptionFilter();
    const req = {
      header: jest.fn().mockReturnValue(undefined),
    };
    const { payload, response } = createResponse();

    filter.catch(
      new UnauthorizedException('登录会话不存在'),
      createHost(req, response),
    );

    expect(payload.statusCode).toBe(401);
    expect(payload.body).toMatchObject({
      code: 'UNAUTHORIZED',
      message: '登录会话不存在',
    });
  });

  it('应将普通错误转换为内部错误结构', () => {
    const filter = new ApiExceptionFilter();
    const req = {
      header: jest.fn().mockReturnValue(undefined),
    };
    const { payload, response } = createResponse();

    filter.catch(new Error('unknown'), createHost(req, response));

    expect(payload.statusCode).toBe(500);
    expect(payload.body).toMatchObject({
      code: 'INTERNAL_ERROR',
      message: '服务内部错误',
    });
  });
});
