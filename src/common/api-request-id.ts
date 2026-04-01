import type { Request } from 'express';
import { randomUUID } from 'crypto';

export const getRequestId = (req: Request) => {
  const fromHeader = req.header('x-request-id')?.trim();
  if (fromHeader) {
    return fromHeader;
  }
  const existing = Reflect.get(req, '__requestId');
  if (typeof existing === 'string') {
    return existing;
  }
  const generated = `req_${randomUUID()}`;
  Reflect.set(req, '__requestId', generated);
  return generated;
};
