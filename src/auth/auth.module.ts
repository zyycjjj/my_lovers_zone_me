import { Global, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthCaptchaService } from './domain/auth-captcha.service';
import { AliyunNumberAuthClient } from './domain/aliyun-number-auth.client';
import { AuthDomain } from './domain/auth.domain';
import { AccountRepository, AuthIdentityRepository } from './repositories/auth.repository';
import { AuthSessionRepository, SessionAccountRepository } from './repositories/session.repository';
import { AuthService } from './auth.service';
import { SessionAuthGuard } from './guards/session-auth.guard';
import { UserGuard } from './guards/user.guard';
import { UserProfileRepository } from '../onboarding/repositories/user-profile.repository';
import { WorkspaceMemberRepository } from '../workspace/repositories/workspace-member.repository';
import { WorkspaceRepository } from '../workspace/repositories/workspace.repository';
import { AdminGuard } from './guards/admin.guard';

@Global()
@Module({
  controllers: [AuthController],
  providers: [
    UserGuard,
    AdminGuard,
    SessionAuthGuard,
    AuthService,
    AuthDomain,
    AuthCaptchaService,
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
    AuthCaptchaService,
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
