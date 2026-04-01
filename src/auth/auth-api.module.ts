import { Module } from '@nestjs/common';
import { AuthController } from './controllers/auth.controller';
import { AuthDomain } from './domain/auth.domain';
import { AccountRepository } from './repositories/account.repository';
import { AuthIdentityRepository } from './repositories/auth-identity.repository';
import { AuthSessionRepository } from './repositories/auth-session.repository';
import { AuthService } from './services/auth.service';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthDomain,
    AccountRepository,
    AuthIdentityRepository,
    AuthSessionRepository,
  ],
  exports: [
    AuthService,
    AuthDomain,
    AccountRepository,
    AuthIdentityRepository,
    AuthSessionRepository,
  ],
})
export class AuthApiModule {}
