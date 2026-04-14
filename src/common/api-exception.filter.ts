import {
  ArgumentsHost,
  BadGatewayException,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { getRequestId } from './api-request-id';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();
    const requestId = getRequestId(req);
    const timestamp = new Date().toISOString();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();
      const responseBody =
        typeof response === 'string' ? { message: response } : response;
      const message = this.extractMessage(responseBody, exception.message);
      const details = this.extractDetails(responseBody);

      res.status(status).json({
        code: this.mapCode(exception, responseBody),
        message,
        requestId,
        timestamp,
        ...(details !== undefined ? { details } : {}),
      });
      return;
    }

    console.error('Unhandled exception:', exception);

    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_ERROR',
      message: '服务内部错误',
      requestId,
      timestamp,
    });
  }

  private mapCode(exception: HttpException, responseBody: unknown) {
    if (exception instanceof UnauthorizedException) {
      return 'UNAUTHORIZED';
    }
    if (exception instanceof BadGatewayException) {
      return 'UPSTREAM_ERROR';
    }
    if (exception instanceof BadRequestException) {
      const details = this.extractDetails(responseBody);
      if (Array.isArray(details)) {
        return 'VALIDATION_ERROR';
      }
      return 'BAD_REQUEST';
    }
    switch (exception.getStatus()) {
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      default:
        return 'HTTP_ERROR';
    }
  }

  private extractMessage(responseBody: unknown, fallback: string) {
    if (
      responseBody &&
      typeof responseBody === 'object' &&
      'message' in responseBody
    ) {
      const value = (responseBody as { message?: unknown }).message;
      if (Array.isArray(value)) {
        return value[0] ?? fallback;
      }
      if (typeof value === 'string') {
        return value;
      }
    }
    return fallback;
  }

  private extractDetails(responseBody: unknown) {
    if (
      responseBody &&
      typeof responseBody === 'object' &&
      'message' in responseBody
    ) {
      const value = (responseBody as { message?: unknown }).message;
      if (Array.isArray(value)) {
        return value;
      }
    }
    return undefined;
  }
}
