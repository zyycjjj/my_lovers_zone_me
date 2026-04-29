import { Controller, Get, Post, Body, UseGuards, Req, Query } from '@nestjs/common';
import { CheckinsService, MoodType } from './checkins.service';
import { UserGuard } from '../auth/guards/user.guard';
import type { Request } from 'express';

@UseGuards(UserGuard)
@Controller('api/checkins')
export class CheckinsController {
  constructor(private readonly checkinsService: CheckinsService) {}

  private userId(req: Request): number {
    return (req as any).userId!;
  }

  @Post()
  async checkIn(
    @Req() req: Request,
    @Body() body: { mood: MoodType; goalKey?: string; sourceHint?: string },
  ) {
    const result = await this.checkinsService.checkIn(this.userId(req), body);
    return { code: 'SUCCESS', message: '开工成功', data: result };
  }

  @Get('today')
  async getToday(@Req() req: Request) {
    const result = await this.checkinsService.getTodayCheckin(this.userId(req));
    return { code: 'SUCCESS', message: '请求成功', data: result };
  }

  @Get('panel')
  async getPanelData(@Req() req: Request) {
    const data = await this.checkinsService.buildCheckinPanelData(this.userId(req));
    return { code: 'SUCCESS', message: '请求成功', data };
  }

  @Get('streak')
  async getStreak(@Req() req: Request) {
    const streak = await this.checkinsService.getStreakCount(this.userId(req));
    return { code: 'SUCCESS', message: '请求成功', data: { streak } };
  }

  @Get('recent')
  async getRecent(
    @Req() req: Request,
    @Query() query?: { days?: string },
  ) {
    const days = query?.days ? parseInt(query.days, 10) : 7;
    const result = await this.checkinsService.getRecentCheckins(this.userId(req), days);
    return { code: 'SUCCESS', message: '请求成功', data: result };
  }
}
