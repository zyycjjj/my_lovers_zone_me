import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
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
import { ContentAssetsService } from './content-assets.service';
import { CreateContentAssetDto } from './dto/create-content-asset.dto';

@ApiTags('content-assets')
@ApiBearerAuth('UserToken')
@Controller('api/content-assets')
@UseGuards(UserGuard)
@UseFilters(ApiExceptionFilter)
@UseInterceptors(ApiResponseInterceptor)
export class ContentAssetsController {
  constructor(private readonly contentAssets: ContentAssetsService) {}

  @Post()
  @ApiOperation({ summary: '保存生成内容' })
  create(@Req() req: Request, @Body() body: CreateContentAssetDto) {
    return this.contentAssets.create({
      userId: req.userId!,
      accountId: req.accountId,
      toolKey: body.toolKey,
      title: body.title,
      content: body.content,
      sourcePrompt: body.sourcePrompt,
      markCompleted: body.markCompleted,
    });
  }

  @Get('me')
  @ApiOperation({ summary: '我的内容资产' })
  listMine(
    @Req() req: Request,
    @Query('limit') limit?: string,
    @Query('date') date?: string,
    @Query('status') status?: string,
  ) {
    const take = limit ? Number.parseInt(limit, 10) : undefined;
    return this.contentAssets.listMine({
      userId: req.userId!,
      accountId: req.accountId,
      limit: Number.isNaN(take) ? undefined : take,
      date: date?.trim() || undefined,
      status: status?.trim() as 'saved' | 'completed' | 'archived' | undefined,
    });
  }

  @Get('stats/me')
  @ApiOperation({ summary: '我的内容资产统计' })
  getMyStats(@Req() req: Request) {
    return this.contentAssets.getStats({
      userId: req.userId!,
      accountId: req.accountId,
    });
  }

  @Post(':id/complete')
  @ApiOperation({ summary: '标记内容已完成' })
  markCompleted(@Req() req: Request, @Param('id', ParseIntPipe) id: number) {
    return this.contentAssets.markCompleted({
      id,
      userId: req.userId!,
      accountId: req.accountId,
    });
  }
}
