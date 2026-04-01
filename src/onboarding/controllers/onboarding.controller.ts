import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { SessionAuthGuard } from '../../auth/session-auth.guard';
import { OnboardingService } from '../services/onboarding.service';
import { OnboardingStatusDto } from '../dto/onboarding-status.dto';
import { UpsertOnboardingProfileDto } from '../dto/upsert-onboarding-profile.dto';
import { UpsertOnboardingProfileResponseDto } from '../dto/upsert-onboarding-profile-response.dto';

@ApiTags('onboarding')
@ApiBearerAuth('SessionToken')
@Controller('api/onboarding')
@UseGuards(SessionAuthGuard)
export class OnboardingController {
  constructor(private readonly onboarding: OnboardingService) {}

  @Get('status')
  @ApiOperation({ summary: '获取首次建档状态' })
  @ApiOkResponse({ type: OnboardingStatusDto })
  async status(@Req() req: Request) {
    return this.onboarding.status(req.sessionToken!);
  }

  @Post('profile')
  @ApiOperation({ summary: '提交首次建档资料' })
  @ApiBody({ type: UpsertOnboardingProfileDto })
  @ApiOkResponse({ type: UpsertOnboardingProfileResponseDto })
  async upsertProfile(
    @Req() req: Request,
    @Body() body: UpsertOnboardingProfileDto,
  ) {
    return this.onboarding.upsertProfile(req.sessionToken!, body);
  }
}
