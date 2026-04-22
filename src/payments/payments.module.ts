import { Module } from '@nestjs/common';
import { EntitlementsModule } from '../entitlements/entitlements.module';
import { PlansModule } from '../plans/plans.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PaymentsController } from './payments.controller.js';
import { PaymentsPublicController } from './payments-public.controller.js';
import { PaymentsService } from './payments.service.js';

@Module({
  imports: [EntitlementsModule, PlansModule, PrismaModule],
  controllers: [PaymentsController, PaymentsPublicController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
