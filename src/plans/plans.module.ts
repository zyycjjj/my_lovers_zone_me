import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PlansService } from './plans.service';

@Module({
  imports: [PrismaModule],
  providers: [PlansService],
  exports: [PlansService],
})
export class PlansModule {}
