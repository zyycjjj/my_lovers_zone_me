import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiExceptionFilter } from '../common/api-exception.filter';
import { ApiResponseInterceptor } from '../common/api-response.interceptor';
import { ApiSuccessResponse } from '../common/api-success-response.decorator';
import { TrialPreviewDto } from './dto/request/trial-preview.dto';
import { TrialPreviewResponseDto } from './dto/response/trial-preview-response.dto';
import { TrialService } from './trial.service';

@ApiTags('trial')
@Controller('api/trial')
@UseFilters(ApiExceptionFilter)
@UseInterceptors(ApiResponseInterceptor)
export class TrialController {
  constructor(private readonly trial: TrialService) {}

  @Post('preview')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '生成体验页预览内容' })
  @ApiBody({ type: TrialPreviewDto })
  @ApiSuccessResponse(TrialPreviewResponseDto)
  async preview(@Body() body: TrialPreviewDto) {
    return this.trial.preview(body);
  }
}
