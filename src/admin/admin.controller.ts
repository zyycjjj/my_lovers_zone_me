import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../auth/guards/admin.guard';
import { UserGuard } from '../auth/guards/user.guard';
import { AdminService } from './admin.service';

@ApiTags('me')
@ApiBearerAuth('SessionToken')
@Controller('api/me')
@UseGuards(UserGuard, AdminGuard)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('admin-check')
  @ApiOperation({ summary: '管理员权限校验' })
  adminCheck() {
    return { ok: true };
  }

  @Get('summary')
  @ApiOperation({ summary: '后台汇总' })
  async summary() {
    return this.admin.summary();
  }

  @Get('photos')
  @ApiOperation({ summary: '后台照片列表' })
  async photos(@Query('limit') limit?: string) {
    const take = limit ? Number(limit) : 20;
    return this.admin.photos(Number.isNaN(take) ? 20 : take);
  }

  @Get('users')
  @ApiOperation({ summary: '后台用户列表（旧）' })
  async users(@Query('limit') limit?: string) {
    const take = limit ? Number(limit) : 50;
    return this.admin.users(Number.isNaN(take) ? 50 : take);
  }

  @Get('accounts')
  @ApiOperation({ summary: '后台账号列表（含订阅状态）' })
  async accounts(@Query('limit') limit?: string) {
    const take = limit ? Number(limit) : 100;
    return this.admin.accounts(Number.isNaN(take) ? 100 : take);
  }

  @Post('manual-activate')
  @ApiOperation({ summary: '手动为用户开通套餐（虚拟订单+自动审核）' })
  async manualActivate(
    @Body()
    body: {
      accountId: number;
      planKey: string;
      note?: string;
    },
  ) {
    return this.admin.manualActivate(body);
  }

  @Get('events')
  @ApiOperation({ summary: '操作记录' })
  async events(@Query('limit') limit?: string) {
    const take = limit ? Number(limit) : 100;
    return this.admin.events(Number.isNaN(take) ? 100 : take);
  }

  @Post('seed-users')
  @ApiOperation({ summary: '生成三人 token 与资料' })
  async seedUsers(
    @Body()
    body: {
      meName?: string;
      girlfriendName?: string;
      testName?: string;
    },
  ) {
    return this.admin.seedUsers(body);
  }

  @Get('payment-orders')
  @ApiOperation({ summary: '支付订单列表' })
  async paymentOrders(@Query('limit') limit?: string) {
    const take = limit ? Number(limit) : 100;
    return this.admin.paymentOrders(Number.isNaN(take) ? 100 : take);
  }

  @Post('payment-orders/approve')
  @ApiOperation({ summary: '审核通过并开通套餐' })
  async approvePaymentOrder(
    @Body()
    body: {
      orderId: number;
      note?: string;
    },
  ) {
    return this.admin.approvePaymentOrder(body.orderId, body.note);
  }

  @Post('payment-orders/reject')
  @ApiOperation({ summary: '驳回支付订单' })
  async rejectPaymentOrder(
    @Body()
    body: {
      orderId: number;
      note?: string;
    },
  ) {
    return this.admin.rejectPaymentOrder(body.orderId, body.note);
  }

  @Get('payment-config')
  @ApiOperation({ summary: '支付配置' })
  paymentConfig() {
    return this.admin.paymentConfig();
  }

  @Post('payment-config')
  @ApiOperation({ summary: '保存支付配置' })
  savePaymentConfig(
    @Body()
    body: {
      unifiedLink?: string;
      alipayLink?: string;
      wechatLink?: string;
      alipayQrImage?: string;
      wechatQrImage?: string;
      contactText?: string;
    },
  ) {
    return this.admin.savePaymentConfig(body);
  }

  @Get('plan-config')
  @ApiOperation({ summary: '套餐配置' })
  planConfig() {
    return this.admin.planConfig();
  }

  @Post('plan-config')
  @ApiOperation({ summary: '保存套餐配置' })
  savePlanConfig(@Body() body: { plans?: unknown }) {
    return this.admin.savePlanConfig(body);
  }
}
