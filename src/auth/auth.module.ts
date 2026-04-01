import { Global, Module } from '@nestjs/common';
import { AdminGuard } from './admin.guard';
import { SessionAuthGuard } from './session-auth.guard';
import { UserGuard } from './user.guard';

@Global()
@Module({
  providers: [UserGuard, AdminGuard, SessionAuthGuard],
  exports: [UserGuard, AdminGuard, SessionAuthGuard],
})
export class AuthModule {}
