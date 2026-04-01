import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthSessionRepository } from '../../auth/repositories/auth-session.repository';
import { WorkspaceMemberRepository } from '../repositories/workspace-member.repository';
import { toWorkspaceSummary } from '../../auth/domain/auth-presenter';

@Injectable()
export class WorkspaceDomain {
  constructor(
    private readonly sessions: AuthSessionRepository,
    private readonly workspaceMembers: WorkspaceMemberRepository,
  ) {}

  async getCurrentWorkspace(sessionToken: string) {
    const members = await this.requireMembers(sessionToken);
    const current = members[0];
    return toWorkspaceSummary(current.workspace, current.role);
  }

  async listMyWorkspaces(sessionToken: string) {
    const members = await this.requireMembers(sessionToken);
    return {
      items: members.map((member) =>
        toWorkspaceSummary(member.workspace, member.role),
      ),
    };
  }

  private async requireMembers(sessionToken: string) {
    const session = await this.sessions.findBySessionToken(sessionToken);
    if (!session || session.expiredAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('登录会话无效');
    }
    const members = await this.workspaceMembers.findByAccountId(session.accountId);
    if (!members.length) {
      throw new UnauthorizedException('当前账号未绑定工作空间');
    }
    return members;
  }
}
