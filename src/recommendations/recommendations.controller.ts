import {
  Controller,
  Get,
  Req,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { UserGuard } from '../auth/guards/user.guard';
import { ApiExceptionFilter } from '../common/api-exception.filter';
import { ApiResponseInterceptor } from '../common/api-response.interceptor';
import { RecommendationsService } from './recommendations.service';

@ApiTags('recommendations')
@ApiBearerAuth('UserToken')
@Controller('api/recommendations')
@UseGuards(UserGuard)
@UseFilters(ApiExceptionFilter)
@UseInterceptors(ApiResponseInterceptor)
export class RecommendationsController {
  constructor(private readonly recommendations: RecommendationsService) {}

  @Get('me')
  @ApiOperation({ summary: '获取个性化推荐（基于心情+历史）' })
  getMyRecommendation(@Req() req: Request) {
    return this.recommendations.getRecommendation(req.userId!);
  }
}
