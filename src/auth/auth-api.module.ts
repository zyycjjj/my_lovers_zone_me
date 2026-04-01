import { Module } from '@nestjs/common';
import { AuthController } from './controllers/auth.controller';
import { AliyunNumberAuthClient } from './domain/aliyun-number-auth.client';
import { AuthDomain } from './domain/auth.domain';
import { AccountRepository } from './repositories/account.repository';
import { AuthIdentityRepository } from './repositories/auth-identity.repository';
import { AuthSessionRepository } from './repositories/auth-session.repository';
import { SessionAccountRepository } from './repositories/session-account.repository';
import { AuthService } from './services/auth.service';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthDomain,
    AliyunNumberAuthClient,
    AccountRepository,
    AuthIdentityRepository,
    AuthSessionRepository,
    SessionAccountRepository,
  ],
  exports: [
    AuthService,
    AuthDomain,
    AliyunNumberAuthClient,
    AccountRepository,
    AuthIdentityRepository,
    AuthSessionRepository,
    SessionAccountRepository,
  ],
})
export class AuthApiModule {}
