import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { ApiExceptionFilter } from '../common/api-exception.filter';
import { ApiResponseInterceptor } from '../common/api-response.interceptor';
import { ApiSuccessResponse } from '../common/api-success-response.decorator';
import { OnboardingService } from './onboarding.service';
import { OnboardingStatusDto } from './dto/onboarding-status.dto';
import { UpsertOnboardingProfileDto } from './dto/upsert-onboarding-profile.dto';
import { UpsertOnboardingProfileResponseDto } from './dto/upsert-onboarding-profile-response.dto';

@ApiTags('onboarding')
@ApiBearerAuth('SessionToken')
@Controller('api/onboarding')
@UseGuards(SessionAuthGuard)
@UseFilters(ApiExceptionFilter)
@UseInterceptors(ApiResponseInterceptor)
export class OnboardingController {
  constructor(private readonly onboarding: OnboardingService) {}

  @Get('status')
  @ApiOperation({ summary: '获取首次建档状态' })
  @ApiSuccessResponse(OnboardingStatusDto)
  async status(@Req() req: Request) {
    return this.onboarding.status(req.sessionToken!);
  }

  @Post('profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '提交首次建档资料' })
  @ApiBody({ type: UpsertOnboardingProfileDto })
  @ApiSuccessResponse(UpsertOnboardingProfileResponseDto)
  async upsertProfile(
    @Req() req: Request,
    @Body() body: UpsertOnboardingProfileDto,
  ) {
    return this.onboarding.upsertProfile(req.sessionToken!, body);
  }
}
