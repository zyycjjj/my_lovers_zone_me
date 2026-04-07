import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { NumberLoginDto } from '../dto/request/number-login.dto';
import { DevLoginDto } from '../dto/request/dev-login.dto';
import { RefreshSessionDto } from '../dto/request/refresh-session.dto';
import { LogoutDto } from '../dto/request/logout.dto';
import { AccountRepository, AuthIdentityRepository, DbClient } from '../repositories/auth.repository';
import { AuthSessionRepository, SessionAccountRepository } from '../repositories/session.repository';
import { WorkspaceRepository } from '../../workspace/repositories/workspace.repository';
import { WorkspaceMemberRepository } from '../../workspace/repositories/workspace-member.repository';
import { UserProfileRepository } from '../../onboarding/repositories/user-profile.repository';
import {
  toAccountSummary,
  toRoutingResult,
  toSessionDto,
  toWorkspaceSummary,
} from './auth-presenter';
import { AliyunNumberAuthClient } from './aliyun-number-auth.client';

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
    const result = await this.loginWithPhone(phone, 'aliyun_number_auth');

    return this.toLoginResponse(result);
  }

  async devLogin(payload: DevLoginDto) {
    if (process.env['NODE_ENV'] === 'production') {
      throw new ForbiddenException('当前环境不允许本地测试登录');
    }

    const phone = payload.phone?.trim() || '13900000000';
    const result = await this.loginWithPhone(phone, 'sms_code', payload.displayName?.trim());

    return this.toLoginResponse(result);
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

  private async loginWithPhone(
    phone: string,
    provider: 'aliyun_number_auth' | 'sms_code',
    displayName?: string,
  ) {
    return this.prisma.$transaction(async (tx: DbClient) => {
      let account = await this.accounts.findByPhone(phone, tx);
      if (!account) {
        account = await this.accounts.createByPhone(phone, tx);
      }

      if (displayName && account.displayName !== displayName) {
        account = await tx.account.update({
          where: { id: account.id },
          data: { displayName },
        });
      }

      const identity = await this.identities.findByProviderPhone(
        provider,
        phone,
        tx,
      );
      if (!identity) {
        await this.identities.createPrimaryIdentity(
          account.id,
          provider,
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
  }

  private toLoginResponse(result: {
    account: Awaited<ReturnType<AccountRepository['createByPhone']>>;
    session: Awaited<ReturnType<AuthSessionRepository['create']>>;
    workspace: Awaited<ReturnType<WorkspaceRepository['createPersonalWorkspace']>>;
    profile: Awaited<ReturnType<UserProfileRepository['findByAccountId']>>;
    workspaceCount: number;
  }) {
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

  private createToken(prefix: string) {
    return `${prefix}_${randomBytes(24).toString('hex')}`;
  }
}
