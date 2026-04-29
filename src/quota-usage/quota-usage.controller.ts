import { Controller, Get, Query, Req, Post, Body } from '@nestjs/common';
import type { Request } from 'express';
import { QuotaUsageService } from './quota-usage.service';

@Controller('quota-usage')
export class QuotaUsageController {
  constructor(private readonly service: QuotaUsageService) {}

  private uid(req: Request): number {
    return (req as any).user?.id;
  }

  @Post()
  record(@Req() req: Request, @Body() body: Record<string, any>) {
    return this.service.record({
      userId: this.uid(req),
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
    @Req() req: Request,
    @Query('accountId') accountId?: string,
    @Query('quotaKey') quotaKey?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.service.listMine({
      userId: this.uid(req),
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
    @Req() req: Request,
    @Query('accountId') accountId?: string,
  ) {
    return this.service.getSummary({
      userId: this.uid(req),
      accountId: accountId ? parseInt(accountId, 10) : undefined,
    });
  }
}
