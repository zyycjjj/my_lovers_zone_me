import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const adminPass = process.env['ADMIN_PASS'];
    if (!adminPass) return true;

    const req = context.switchToHttp().getRequest<Request>();
    const provided = req.get('x-admin-pass');
    if (provided === adminPass) return true;
    throw new UnauthorizedException('Unauthorized');
  }
}
