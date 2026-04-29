import { Module } from '@nestjs/common';
import { QuotaUsageController } from './quota-usage.controller';
import { QuotaUsageService } from './quota-usage.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [QuotaUsageController],
  providers: [QuotaUsageService],
  exports: [QuotaUsageService],
})
export class QuotaUsageModule {}
