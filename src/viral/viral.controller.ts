import {
  Body,
  Controller,
  Get,
  Query,
  Post,
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
import { ViralAnalyzeDto } from './dto/viral-analyze.dto';
import { ViralService } from './viral.service';

@ApiTags('viral')
@ApiBearerAuth('UserToken')
@Controller('api/viral')
@UseGuards(UserGuard)
@UseFilters(ApiExceptionFilter)
@UseInterceptors(ApiResponseInterceptor)
export class ViralController {
  constructor(private readonly viral: ViralService) {}

  @Post('analyze')
  @ApiOperation({ summary: '爆款复刻：拆解爆款结构并生成我的版本' })
  async analyze(@Req() req: Request, @Body() body: ViralAnalyzeDto) {
    return this.viral.analyze(req.userId!, req.accountId, body);
  }

  @Get('mine')
  @ApiOperation({ summary: '我的爆款复刻记录' })
  async listMine(
    @Req() req: Request,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.viral.listMine(req.userId!, {
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
  }
}
