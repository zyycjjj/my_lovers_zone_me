import { NestMiddleware } from '@nestjs/common';
import type { Request, Response } from 'express';
export declare class UserTokenMiddleware implements NestMiddleware {
    use(req: Request, _res: Response, next: () => void): void;
}
