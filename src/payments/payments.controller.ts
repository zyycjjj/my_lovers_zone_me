import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { UserGuard } from '../auth/guards/user.guard';
import { CreatePaymentOrderDto } from './dto/create-payment-order.dto';
import { SubmitPaymentProofDto } from './dto/submit-payment-proof.dto';
import { PaymentsService } from './payments.service';

@ApiTags('payments')
@ApiBearerAuth('UserToken')
@Controller('api/payments')
@UseGuards(UserGuard)
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post('orders')
  @ApiOperation({ summary: '创建支付订单' })
  createOrder(@Req() req: Request, @Body() body: CreatePaymentOrderDto) {
    return this.payments.createOrder({
      userId: req.userId!,
      accountId: req.accountId,
      planKey: body.planKey,
    });
  }

  @Get('orders/me')
  @ApiOperation({ summary: '我的支付订单' })
  listMyOrders(@Req() req: Request) {
    return this.payments.listMyOrders({
      userId: req.userId!,
      accountId: req.accountId,
    });
  }

  @Get('orders/:id')
  @ApiOperation({ summary: '支付订单详情' })
  getOrder(@Req() req: Request, @Param('id', ParseIntPipe) id: number) {
    return this.payments.getMyOrderById({
      orderId: id,
      userId: req.userId!,
      accountId: req.accountId,
    });
  }

  @Get('subscription/me')
  @ApiOperation({ summary: '我的订阅状态' })
  mySubscription(@Req() req: Request) {
    return this.payments.getMySubscription({
      accountId: req.accountId,
    });
  }

  @Get('pending/me')
  @ApiOperation({ summary: '我的待处理订单统计' })
  myPending(@Req() req: Request) {
    return this.payments.getMyPendingSummary({
      userId: req.userId!,
      accountId: req.accountId,
    });
  }

  @Post('orders/:id/proof')
  @ApiOperation({ summary: '提交支付凭证（人工审核）' })
  submitProof(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: SubmitPaymentProofDto,
  ) {
    return this.payments.submitProof({
      orderId: id,
      userId: req.userId!,
      accountId: req.accountId,
      paymentRef: body.paymentRef,
      note: body.note,
    });
  }
}
