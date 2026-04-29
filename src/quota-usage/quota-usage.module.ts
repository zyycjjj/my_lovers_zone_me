import { Module } from '@nestjs/common';
import { QuotaUsageController } from './quota-usage.controller';
import { QuotaUsageService } from './quota-usage.service';

@Module({
  controllers: [QuotaUsageController],
  providers: [QuotaUsageService],
})
export class QuotaUsageModule {}
