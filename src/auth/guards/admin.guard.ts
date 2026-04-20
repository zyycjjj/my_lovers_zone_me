import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  private parseCsv(raw?: string) {
    return (raw || '')
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
  }

  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<Request>();
    if (!req.accountId) {
      throw new UnauthorizedException('Admin session required');
    }

    return this.validateAdminAccess(req.accountId);
  }

  private async validateAdminAccess(accountId: number) {
    const allowIds = this.parseCsv(process.env['ADMIN_ACCOUNT_IDS']);
    const allowPhones = this.parseCsv(process.env['ADMIN_ACCOUNT_PHONES']);

    if (!allowIds.length && !allowPhones.length) {
      throw new ForbiddenException('Admin account whitelist is not configured');
    }

    if (allowIds.includes(String(accountId))) return true;

    if (allowPhones.length) {
      const account = await this.prisma.account.findUnique({
        where: { id: accountId },
        select: { phone: true },
      });
      if (account?.phone && allowPhones.includes(account.phone)) return true;
    }

    throw new ForbiddenException('No admin permission');
  }
}
