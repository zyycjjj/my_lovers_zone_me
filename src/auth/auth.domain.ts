import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { NumberLoginDto } from './dto/number-login.dto';
import { RefreshSessionDto } from './dto/refresh-session.dto';
import { LogoutDto } from './dto/logout.dto';
import { AccountRepository } from './repositories/account.repository';
import { AuthIdentityRepository } from './repositories/auth-identity.repository';
import { AuthSessionRepository } from './repositories/auth-session.repository';
import { SessionAccountRepository } from './repositories/session-account.repository';
import { WorkspaceRepository } from '../workspace/repositories/workspace.repository';
import { WorkspaceMemberRepository } from '../workspace/repositories/workspace-member.repository';
import { UserProfileRepository } from '../onboarding/repositories/user-profile.repository';
import { DbClient } from './repositories/repository.types';
import {
  toAccountSummary,
  toRoutingResult,
  toSessionDto,
  toWorkspaceSummary,
} from './domain/auth-presenter';
import { AliyunNumberAuthClient } from './domain/aliyun-number-auth.client';

@Injectable()
export class AuthDomain {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aliyun: AliyunNumberAuthClient,
    private readonly accounts: AccountRepository,
    private readonly identities: AuthIdentityRepository,
    private readonly sessions: AuthSessionRepository,
    private readonly sessionAccounts: SessionAccountRepository,
    private readonly workspaces: WorkspaceRepository,
    private readonly workspaceMembers: WorkspaceMemberRepository,
    private readonly profiles: UserProfileRepository,
  ) {}

  async getNumberAuthToken() {
    return this.aliyun.getAuthToken();
  }

  async numberLogin(payload: NumberLoginDto) {
    const { phone } = await this.aliyun.getPhoneWithToken(payload.spToken);
    const result = await this.prisma.$transaction(async (tx: DbClient) => {
      let account = await this.accounts.findByPhone(phone, tx);
      if (!account) {
        account = await this.accounts.createByPhone(phone, tx);
      }

      const identity = await this.identities.findByProviderPhone(
        'aliyun_number_auth',
        phone,
        tx,
      );
      if (!identity) {
        await this.identities.createPrimaryIdentity(
          account.id,
          'aliyun_number_auth',
          phone,
          phone,
          tx,
        );
      }

      let workspace = await this.workspaces.findPersonalOwnedByAccountId(
        account.id,
        tx,
      );
      if (!workspace) {
        const workspaceName = account.displayName
          ? `${account.displayName}的空间`
          : '我的空间';
        workspace = await this.workspaces.createPersonalWorkspace(
          account.id,
          workspaceName,
          tx,
        );
      }

      await this.workspaceMembers.upsertOwnerMember(workspace.id, account.id, tx);

      const session = await this.sessions.create(
        {
          accountId: account.id,
          sessionToken: this.createToken('session'),
          refreshToken: this.createToken('refresh'),
          expiredAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
        tx,
      );

      const profile = await this.profiles.findByAccountId(account.id, tx);
      const members = await this.workspaceMembers.findByAccountId(account.id, tx);

      return {
        account,
        session,
        workspace,
        profile,
        workspaceCount: members.length,
      };
    });

    return {
      account: toAccountSummary(result.account),
      session: toSessionDto(result.session),
      routing: toRoutingResult({
        profile: result.profile,
        workspaceId: result.workspace.id,
        workspaceCount: result.workspaceCount,
      }),
    };
  }

  async getCurrentAccount(sessionToken: string) {
    const context = await this.requireSessionContext(sessionToken);

    return {
      account: toAccountSummary(context.account),
      currentWorkspace: context.currentWorkspace,
      onboardingCompleted: Boolean(context.profile?.onboardingCompletedAt),
    };
  }

  async getRouting(sessionToken: string) {
    const context = await this.requireSessionContext(sessionToken);
    return toRoutingResult({
      profile: context.profile,
      workspaceId: context.currentWorkspace?.id,
      workspaceCount: context.workspaceCount,
    });
  }

  async refreshSession(sessionToken: string, payload: RefreshSessionDto) {
    let session = await this.sessions.findBySessionToken(sessionToken);
    if (!session && payload.refreshToken) {
      session = await this.sessions.findByRefreshToken(payload.refreshToken);
    }
    if (!session) {
      throw new UnauthorizedException('登录会话不存在');
    }

    const updated = await this.sessions.updateTokens(session.id, {
      sessionToken: this.createToken('session'),
      refreshToken: payload.rotateRefreshToken
        ? this.createToken('refresh')
        : session.refreshToken || this.createToken('refresh'),
      expiredAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return toSessionDto(updated);
  }

  async logout(sessionToken: string, payload: LogoutDto) {
    const session = await this.sessions.findBySessionToken(sessionToken);
    if (!session) {
      throw new UnauthorizedException('登录会话不存在');
    }

    if (payload.allDevices) {
      await this.sessions.deleteByAccountId(session.accountId);
      return { ok: true };
    }

    await this.sessions.deleteBySessionToken(sessionToken);
    return { ok: true };
  }

  private async requireSessionContext(sessionToken: string) {
    const session = await this.sessionAccounts.findSessionBundle(sessionToken);
    if (!session) {
      throw new UnauthorizedException('登录会话不存在');
    }
    if (session.expiredAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('登录会话已过期');
    }

    await this.sessions.touch(session.id);

    const members = await this.workspaceMembers.findByAccountId(session.accountId);
    const profile = await this.profiles.findByAccountId(session.accountId);
    const currentMember = members[0];
    const currentWorkspace = currentMember
      ? toWorkspaceSummary(currentMember.workspace, currentMember.role)
      : null;

    return {
      account: session.account,
      profile,
      currentWorkspace,
      workspaceCount: members.length,
    };
  }

  private createToken(prefix: string) {
    return `${prefix}_${randomBytes(24).toString('hex')}`;
  }
}
