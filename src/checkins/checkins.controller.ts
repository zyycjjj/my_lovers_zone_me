import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { CheckinsService, MoodType } from './checkins.service';
import { UserGuard } from '../auth/guards/user.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(UserGuard)
@Controller('api/checkins')
export class CheckinsController {
  constructor(private readonly checkinsService: CheckinsService) {}

  @Post()
  async checkIn(
    @CurrentUser('id') userId: number,
    @Body() body: { mood: MoodType; goalKey?: string; sourceHint?: string },
  ) {
    const result = await this.checkinsService.checkIn(userId, body);
    return { code: 'SUCCESS', message: '开工成功', data: result };
  }

  @Get('today')
  async getToday(@CurrentUser('id') userId: number) {
    const result = await this.checkinsService.getTodayCheckin(userId);
    return { code: 'SUCCESS', message: '请求成功', data: result };
  }

  @Get('panel')
  async getPanelData(@CurrentUser('id') userId: number) {
    const data = await this.checkinsService.buildCheckinPanelData(userId);
    return { code: 'SUCCESS', message: '请求成功', data };
  }

  @Get('streak')
  async getStreak(@CurrentUser('id') userId: number) {
    const streak = await this.checkinsService.getStreakCount(userId);
    return { code: 'SUCCESS', message: '请求成功', data: { streak } };
  }

  @Get('recent')
  async getRecent(
    @CurrentUser('id') userId: number,
    @Body() body?: { days?: number },
  ) {
    const days = body?.days ?? 7;
    const result = await this.checkinsService.getRecentCheckins(userId, days);
    return { code: 'SUCCESS', message: '请求成功', data: result };
  }
}
