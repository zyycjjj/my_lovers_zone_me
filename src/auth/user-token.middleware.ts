import { Injectable, NestMiddleware } from '@nestjs/common';
import type { Request, Response } from 'express';

@Injectable()
export class UserTokenMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: () => void) {
    const headerToken = req.header('x-user-token');
    const queryToken =
      typeof req.query['t'] === 'string' ? req.query['t'] : undefined;
    const cookieToken =
      typeof req.cookies?.['t'] === 'string' ? req.cookies['t'] : undefined;
    const token = (headerToken ?? queryToken ?? cookieToken)?.trim();
    if (token) req.userToken = token;
    next();
  }
}
