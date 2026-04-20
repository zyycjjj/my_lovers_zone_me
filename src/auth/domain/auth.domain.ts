import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Account } from '@prisma/client';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { NumberLoginDto } from '../dto/request/number-login.dto';
import { DevLoginDto } from '../dto/request/dev-login.dto';
import { PasswordLoginDto } from '../dto/request/password-login.dto';
import { PasswordRegisterDto } from '../dto/request/password-register.dto';
import { RefreshSessionDto } from '../dto/request/refresh-session.dto';
import { LogoutDto } from '../dto/request/logout.dto';
import {
  AccountRepository,
  AuthIdentityRepository,
  DbClient,
} from '../repositories/auth.repository';
import {
  AuthSessionRepository,
  SessionAccountRepository,
} from '../repositories/session.repository';
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
import { AuthCaptchaService } from './auth-captcha.service';

@Injectable()
export class AuthDomain {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aliyun: AliyunNumberAuthClient,
    private readonly captchas: AuthCaptchaService,
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

  getPasswordCaptcha() {
    return this.captchas.createCaptcha();
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
    const result = await this.loginWithPhone(
      phone,
      'sms_code',
      payload.displayName?.trim(),
    );

    return this.toLoginResponse(result);
  }

  async passwordRegister(payload: PasswordRegisterDto) {
    this.captchas.verifyCaptcha(payload.captchaId, payload.captchaCode);

    const phone = this.normalizePhone(payload.phone);
    const displayName = payload.displayName?.trim() || undefined;
    this.assertPasswordStrength(payload.password);

    const result = await this.prisma.$transaction(
      async (tx: DbClient) => {
        const existing = await this.accounts.findByPhone(phone, tx);
        if (existing?.passwordHash && existing.passwordSalt) {
          throw new BadRequestException('该手机号已完成注册，可直接登录');
        }

        const { passwordHash, passwordSalt } = this.hashPassword(
          payload.password,
        );
        const account = existing
          ? await this.accounts.updatePasswordCredential(
              existing.id,
              {
                passwordHash,
                passwordSalt,
                displayName,
              },
              tx,
            )
          : await this.accounts.createPasswordAccount(
              {
                phone,
                passwordHash,
                passwordSalt,
                displayName,
              },
              tx,
            );

        return this.createAccessBundle(account, tx);
      },
      {
        maxWait: 15_000,
        timeout: 20_000,
      },
    );

    return this.toLoginResponse(result);
  }

  async passwordLogin(payload: PasswordLoginDto) {
    this.captchas.verifyCaptcha(payload.captchaId, payload.captchaCode);

    const phone = this.normalizePhone(payload.phone);
    const account = await this.accounts.findByPhone(phone);
    if (!account?.passwordHash || !account.passwordSalt) {
      throw new UnauthorizedException('手机号或密码错误');
    }
    if (account.status !== 'active') {
      throw new ForbiddenException('当前账号不可用');
    }
    if (
      !this.verifyPassword(
        payload.password,
        account.passwordSalt,
        account.passwordHash,
      )
    ) {
      throw new UnauthorizedException('手机号或密码错误');
    }

    const result = await this.prisma.$transaction(
      async (tx: DbClient) => {
        const freshAccount = await this.accounts.findById(account.id, tx);
        if (!freshAccount) {
          throw new UnauthorizedException('账号不存在');
        }

        return this.createAccessBundle(freshAccount, tx);
      },
      {
        maxWait: 15_000,
        timeout: 20_000,
      },
    );

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

    const members = await this.workspaceMembers.findByAccountId(
      session.accountId,
    );
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
    return this.prisma.$transaction(
      async (tx: DbClient) => {
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

        return this.createAccessBundle(account, tx);
      },
      {
        maxWait: 15_000,
        timeout: 20_000,
      },
    );
  }

  private async createAccessBundle(account: Account, tx: DbClient) {
    let workspace = await this.workspaces.findPersonalOwnedByAccountId(
      account.id,
      tx,
    );
    if (!workspace) {
      workspace = await this.workspaces.createPersonalWorkspace(
        account.id,
        this.getWorkspaceName(account),
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
  }

  private toLoginResponse(result: {
    account: Account;
    session: Awaited<ReturnType<AuthSessionRepository['create']>>;
    workspace: Awaited<
      ReturnType<WorkspaceRepository['createPersonalWorkspace']>
    >;
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

  private normalizePhone(value: string) {
    const phone = value.trim();
    if (!/^1\d{10}$/.test(phone)) {
      throw new BadRequestException('请输入正确的 11 位手机号');
    }
    return phone;
  }

  private assertPasswordStrength(password: string) {
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSymbol = /[^a-zA-Z0-9]/.test(password);
    const hitCount = [hasLetter, hasNumber, hasSymbol].filter(Boolean).length;

    if (password.trim().length < 8 || hitCount < 2) {
      throw new BadRequestException(
        '密码至少 8 位，且需包含字母、数字、符号中的至少两种',
      );
    }
  }

  private hashPassword(
    password: string,
    salt = randomBytes(16).toString('hex'),
  ) {
    return {
      passwordSalt: salt,
      passwordHash: scryptSync(password, salt, 64).toString('hex'),
    };
  }

  private verifyPassword(password: string, salt: string, expectedHash: string) {
    const actualHash = scryptSync(password, salt, 64).toString('hex');
    return timingSafeEqual(
      Buffer.from(actualHash, 'hex'),
      Buffer.from(expectedHash, 'hex'),
    );
  }

  private getWorkspaceName(account: Account) {
    const baseName = account.displayName || account.phone;
    return baseName ? `${baseName}的空间` : '我的空间';
  }
}
