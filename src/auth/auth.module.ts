import { Global, Module } from '@nestjs/common';
import { AdminGuard } from './admin.guard';
import { AuthController } from './auth.controller';
import { AliyunNumberAuthClient } from './aliyun-number-auth.client';
import { AuthDomain } from './auth.domain';
import { AccountRepository } from './repositories/account.repository';
import { AuthIdentityRepository } from './repositories/auth-identity.repository';
import { AuthSessionRepository } from './repositories/auth-session.repository';
import { SessionAccountRepository } from './repositories/session-account.repository';
import { AuthService } from './auth.service';
import { SessionAuthGuard } from './session-auth.guard';
import { UserGuard } from './user.guard';
import { UserProfileRepository } from '../onboarding/repositories/user-profile.repository';
import { WorkspaceMemberRepository } from '../workspace/repositories/workspace-member.repository';
import { WorkspaceRepository } from '../workspace/repositories/workspace.repository';

@Global()
@Module({
  controllers: [AuthController],
  providers: [
    UserGuard,
    AdminGuard,
    SessionAuthGuard,
    AuthService,
    AuthDomain,
    AliyunNumberAuthClient,
    AccountRepository,
    AuthIdentityRepository,
    AuthSessionRepository,
    SessionAccountRepository,
    WorkspaceRepository,
    WorkspaceMemberRepository,
    UserProfileRepository,
  ],
  exports: [
    UserGuard,
    AdminGuard,
    SessionAuthGuard,
    AuthService,
    AuthDomain,
    AliyunNumberAuthClient,
    AccountRepository,
    AuthIdentityRepository,
    AuthSessionRepository,
    SessionAccountRepository,
    WorkspaceRepository,
    WorkspaceMemberRepository,
    UserProfileRepository,
  ],
})
export class AuthModule {}
