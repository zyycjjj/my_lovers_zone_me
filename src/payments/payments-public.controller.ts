import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';

@ApiTags('payments')
@Controller('api/payments')
export class PaymentsPublicController {
  constructor(private readonly payments: PaymentsService) {}

  @Get('config/public')
  @ApiOperation({ summary: '公开支付配置（链接/收款码）' })
  publicConfig() {
    return this.payments.getPublicPaymentConfig();
  }

  @Get('plans/public')
  @ApiOperation({ summary: '公开套餐配置' })
  publicPlans() {
    return this.payments.getPublicPlanConfig();
  }
}
