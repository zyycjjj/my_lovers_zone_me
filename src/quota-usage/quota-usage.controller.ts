import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { AdminGuard } from '../auth/guards/admin.guard';
import { UserGuard } from '../auth/guards/user.guard';
import { QuotaUsageService } from './quota-usage.service';

@ApiTags('quota-usage')
@ApiBearerAuth('UserToken')
@Controller('api/quota-usage')
@UseGuards(UserGuard)
export class QuotaUsageController {
  constructor(private readonly service: QuotaUsageService) {}

  private uid(req: Request): number {
    return (req as any).user?.id;
  }

  @Post()
  @ApiOperation({ summary: '记录一次额度使用（内部调用）' })
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
  @ApiOperation({ summary: '我的额度使用记录（分页）' })
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
  @ApiOperation({ summary: '我的额度使用汇总' }) getSummary(
    @Req() req: Request,
    @Query('accountId') accountId?: string,
  ) {
    return this.service.getSummary({
      userId: this.uid(req),
      accountId: accountId ? parseInt(accountId, 10) : undefined,
    });
  }

  @Get('detail')
  @ApiOperation({ summary: '最近消耗明细（含工具类型和描述）' })
  getDetail(
    @Req() req: Request,
    @Query('days') days?: string,
  ) {
    const d = days ? parseInt(days, 10) : 7;
    return this.service.getDetailedUsage({
      userId: this.uid(req),
      days: Math.min(Math.max(d, 1), 30),
    });
  }

  @Post('admin/grant')
  @UseGuards(AdminGuard)
  @ApiBearerAuth('UserToken')
  @ApiOperation({ summary: '管理员补发额度' })
  grantQuota(@Req() req: Request, @Body() body: { accountId: number; amount: number; reason?: string }) {
    return this.service.grantQuota({
      operatorId: this.uid(req),
      accountId: body.accountId,
      amount: body.amount,
      reason: body.reason,
    });
  }

  @Post('admin/reset')
  @UseGuards(AdminGuard)
  @ApiBearerAuth('UserToken')
  @ApiOperation({ summary: '管理员重置用户额度' })
  resetQuota(@Req() req: Request, @Body() body: { accountId: number; newLimit?: number; resetUsed?: boolean }) {
    return this.service.resetQuota({
      operatorId: this.uid(req),
      accountId: body.accountId,
      newLimit: body.newLimit,
      resetUsed: body.resetUsed,
    });
  }
}
