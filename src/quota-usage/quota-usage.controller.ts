import { Controller, Get, Query, Req, Post, Body } from '@nestjs/common';
import { QuotaUsageService } from './quota-usage.service';

@Controller('quota-usage')
export class QuotaUsageController {
  constructor(private readonly service: QuotaUsageService) {}

  @Post()
  record(@Req() req, @Body() body: Record<string, any>) {
    return this.service.record({
      userId: req.user?.id,
      accountId: body.accountId,
      planKey: body.planKey || 'unknown',
      quotaKey: body.quotaKey,
      amount: body.amount,
      description: body.description,
      refType: body.refType,
      refId: body.refId,
      balanceAfter: body.balanceAfter,
    });
  }

  @Get()
  listMine(
    @Req() req,
    @Query('accountId') accountId?: string,
    @Query('quotaKey') quotaKey?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.service.listMine({
      userId: req.user?.id,
      accountId: accountId ? parseInt(accountId, 10) : undefined,
      quotaKey,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
      startDate,
      endDate,
    });
  }

  @Get('summary')
  getSummary(
    @Req() req,
    @Query('accountId') accountId?: string,
  ) {
    return this.service.getSummary({
      userId: req.user?.id,
      accountId: accountId ? parseInt(accountId, 10) : undefined,
    });
  }
}
