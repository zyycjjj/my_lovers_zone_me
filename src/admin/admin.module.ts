import { Module } from '@nestjs/common';
import { AdminGuard } from '../auth/guards/admin.guard';
import { UserGuard } from '../auth/guards/user.guard';
import { PaymentsModule } from '../payments/payments.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [PaymentsModule, PrismaModule],
  controllers: [AdminController],
  providers: [AdminService, UserGuard, AdminGuard],
})
export class AdminModule {}
