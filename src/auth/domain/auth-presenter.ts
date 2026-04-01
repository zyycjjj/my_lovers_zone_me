import { Account, AuthSession, UserProfile, Workspace } from '@prisma/client';

export const toAccountSummary = (account: Account) => ({
  id: account.id,
  phone: account.phone,
  displayName: account.displayName,
  status: account.status,
});

export const toSessionDto = (session: AuthSession) => ({
  sessionToken: session.sessionToken,
  refreshToken: session.refreshToken,
  expiredAt: session.expiredAt.toISOString(),
});

export const toWorkspaceSummary = (
  workspace: Workspace,
  role: string,
) => ({
  id: workspace.id,
  name: workspace.name,
  type: workspace.type,
  role,
  status: workspace.status,
});

export const toRoutingResult = ({
  profile,
  workspaceId,
  workspaceCount,
}: {
  profile: UserProfile | null;
  workspaceId?: number;
  workspaceCount: number;
}) => {
  if (!profile?.onboardingCompletedAt) {
    return {
      routeType: 'onboarding' as const,
      workspaceId,
      reason: '首次登录，尚未完成建档',
    };
  }

  if (workspaceCount > 1) {
    return {
      routeType: 'workspace_select' as const,
      reason: '账号下存在多个工作空间，需要先选择空间',
    };
  }

  return {
    routeType: 'workspace_home' as const,
    workspaceId,
    reason: '建档已完成，进入当前工作空间',
  };
};
