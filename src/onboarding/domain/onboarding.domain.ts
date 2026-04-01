import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AccountRepository } from '../../auth/repositories/account.repository';
import { AuthSessionRepository } from '../../auth/repositories/auth-session.repository';
import { WorkspaceMemberRepository } from '../../workspace/repositories/workspace-member.repository';
import { UpsertOnboardingProfileDto } from '../dto/upsert-onboarding-profile.dto';
import { UserProfileRepository } from '../repositories/user-profile.repository';
import { WorkspaceRepository } from '../../workspace/repositories/workspace.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { toRoutingResult } from '../../auth/domain/auth-presenter';

@Injectable()
export class OnboardingDomain {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessions: AuthSessionRepository,
    private readonly accounts: AccountRepository,
    private readonly profiles: UserProfileRepository,
    private readonly workspaceMembers: WorkspaceMemberRepository,
    private readonly workspaces: WorkspaceRepository,
  ) {}

  async getStatus(sessionToken: string) {
    const context = await this.requireContext(sessionToken);

    return {
      completed: Boolean(context.profile?.onboardingCompletedAt),
      profileExists: Boolean(context.profile),
      workspaceId: context.workspace.id,
      nextStep: toRoutingResult({
        profile: context.profile,
        workspaceId: context.workspace.id,
        workspaceCount: context.workspaceCount,
      }).routeType,
    };
  }

  async upsertProfile(sessionToken: string, payload: UpsertOnboardingProfileDto) {
    const context = await this.requireContext(sessionToken);
    const completedAt = new Date();

    const profile = await this.prisma.$transaction(async (tx) => {
      const updatedAccount = await this.accounts.updateDisplayName(
        context.account.id,
        payload.nickname,
        tx,
      );

      const workspaceName = `${payload.nickname}的空间`;
      await tx.workspace.update({
        where: { id: context.workspace.id },
        data: { name: workspaceName },
      });

      const upserted = await this.profiles.upsertByAccountId(
        {
          accountId: updatedAccount.id,
          workspaceId: context.workspace.id,
          nickname: payload.nickname,
          industry: payload.industry,
          contentDirection: payload.contentDirection,
          targetPlatform: payload.targetPlatform,
          experienceLevel: payload.experienceLevel,
          onboardingCompletedAt: completedAt,
        },
        tx,
      );

      return upserted;
    });

    return {
      profile: {
        id: profile.id,
        accountId: profile.accountId,
        workspaceId: profile.workspaceId,
        nickname: profile.nickname,
        industry: profile.industry,
        contentDirection: profile.contentDirection,
        targetPlatform: profile.targetPlatform,
        experienceLevel: profile.experienceLevel,
        onboardingCompletedAt: profile.onboardingCompletedAt?.toISOString() || null,
      },
      routing: toRoutingResult({
        profile,
        workspaceId: context.workspace.id,
        workspaceCount: context.workspaceCount,
      }),
    };
  }

  private async requireContext(sessionToken: string) {
    const session = await this.sessions.findBySessionToken(sessionToken);
    if (!session || session.expiredAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('登录会话无效');
    }

    const account = await this.accounts.findById(session.accountId);
    if (!account) {
      throw new UnauthorizedException('账号不存在');
    }

    const profile = await this.profiles.findByAccountId(account.id);
    const members = await this.workspaceMembers.findByAccountId(account.id);
    const workspaceId = members[0]?.workspaceId;
    if (!workspaceId) {
      throw new UnauthorizedException('当前账号未绑定工作空间');
    }
    const workspace = await this.workspaces.findById(workspaceId);
    if (!workspace) {
      throw new UnauthorizedException('当前工作空间不存在');
    }

    return {
      account,
      profile,
      workspace,
      workspaceCount: members.length,
    };
  }
}
