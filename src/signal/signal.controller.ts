import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { UserGuard } from '../auth/user.guard';
import { SignalDto } from './dto/signal.dto';
import { SignalService } from './signal.service';

@ApiTags('signal')
@ApiBearerAuth('UserToken')
@Controller('api/signal')
@UseGuards(UserGuard)
export class SignalController {
  constructor(private readonly signals: SignalService) {}

  @Post()
  @ApiOperation({ summary: '提交今日轻信号' })
  async submit(@Req() req: Request, @Body() body: SignalDto) {
    return this.signals.submit(req.userId!, body);
  }

  @Get('today')
  @ApiOperation({ summary: '获取今日轻信号' })
  async today(@Req() req: Request) {
    return this.signals.getToday(req.userId!);
  }
}
