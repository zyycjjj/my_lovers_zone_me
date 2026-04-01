import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request } from 'express';
import { Observable, map } from 'rxjs';
import { getRequestId } from './api-request-id';

@Injectable()
export class ApiResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const requestId = getRequestId(req);

    return next.handle().pipe(
      map((data) => ({
        code: 'SUCCESS',
        message: '请求成功',
        requestId,
        timestamp: new Date().toISOString(),
        data,
      })),
    );
  }
}
