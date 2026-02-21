import { Global, Module } from '@nestjs/common';
import { AdminGuard } from './admin.guard';
import { UserGuard } from './user.guard';

@Global()
@Module({
  providers: [UserGuard, AdminGuard],
  exports: [UserGuard, AdminGuard],
})
export class AuthModule {}
