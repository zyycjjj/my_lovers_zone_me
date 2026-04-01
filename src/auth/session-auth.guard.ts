import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

@Injectable()
export class SessionAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const headerToken = req.header('x-session-token')?.trim();
    const cookieToken =
      typeof req.cookies?.['session_token'] === 'string'
        ? req.cookies['session_token'].trim()
        : undefined;
    const sessionToken = headerToken || cookieToken;

    if (!sessionToken) {
      throw new UnauthorizedException('Missing session token');
    }

    req.sessionToken = sessionToken;
    return true;
  }
}
