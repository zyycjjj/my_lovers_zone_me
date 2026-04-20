import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthSessionRepository } from '../repositories/session.repository';
import { WorkspaceMemberRepository } from '../../workspace/repositories/workspace-member.repository';

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(
    private readonly sessions: AuthSessionRepository,
    private readonly workspaceMembers: WorkspaceMemberRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
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

    const session = await this.sessions.findBySessionToken(sessionToken);
    if (!session) {
      throw new UnauthorizedException('Session not found');
    }
    if (session.expiredAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('Session expired');
    }

    await this.sessions.touch(session.id);
    const members = await this.workspaceMembers.findByAccountId(
      session.accountId,
    );

    req.sessionToken = sessionToken;
    req.accountId = session.accountId;
    req.workspaceId = members[0]?.workspaceId;
    return true;
  }
}
