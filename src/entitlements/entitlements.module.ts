import { Module } from '@nestjs/common';
import { PlansModule } from '../plans/plans.module';
import { PrismaModule } from '../prisma/prisma.module';
import { EntitlementsService } from './entitlements.service';

@Module({
  imports: [PlansModule, PrismaModule],
  providers: [EntitlementsService],
  exports: [EntitlementsService],
})
export class EntitlementsModule {}
