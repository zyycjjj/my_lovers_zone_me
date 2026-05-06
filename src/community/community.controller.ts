import {
  Body,
  Controller,
  Delete,
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
import { CommunityService } from './community.service';

@ApiTags('community')
@ApiBearerAuth('UserToken')
@Controller('api/community')
@UseGuards(UserGuard)
@UseFilters(ApiExceptionFilter)
@UseInterceptors(ApiResponseInterceptor)
export class CommunityController {
  constructor(private readonly community: CommunityService) {}

  @Get('posts')
  @ApiOperation({ summary: '社区帖子列表' })
  listPosts(
    @Query('type') type?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.community.listPosts({
      type,
      limit: limit ? Number.parseInt(limit, 10) : undefined,
      offset: offset ? Number.parseInt(offset, 10) : undefined,
    });
  }

  @Post('posts')
  @ApiOperation({ summary: '发布社区任务卡' })
  createPost(
    @Req() req: Request,
    @Body()
    body: {
      type: string;
      title: string;
      content: string;
      platform?: string;
      sourceUrl?: string;
      assetId?: number;
    },
  ) {
    return this.community.createPost({
      userId: req.userId!,
      accountId: req.accountId,
      type: body.type,
      title: body.title,
      content: body.content,
      platform: body.platform,
      sourceUrl: body.sourceUrl,
      assetId: body.assetId,
    });
  }

  @Get('posts/:id')
  @ApiOperation({ summary: '社区帖子详情' })
  getPost(@Param('id', ParseIntPipe) id: number) {
    return this.community.getPost(id);
  }

  @Post('posts/:id/comments')
  @ApiOperation({ summary: '给帖子留一句反馈' })
  addComment(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { content: string },
  ) {
    return this.community.addComment({
      postId: id,
      userId: req.userId!,
      accountId: req.accountId,
      content: body.content,
    });
  }

  @Post('posts/:id/reactions')
  @ApiOperation({ summary: '点赞或收藏帖子' })
  toggleReaction(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { kind: string },
  ) {
    return this.community.toggleReaction({
      postId: id,
      userId: req.userId!,
      accountId: req.accountId,
      kind: body.kind,
    });
  }

  @Delete('posts/:id')
  @ApiOperation({ summary: '移除自己的帖子' })
  removePost(@Req() req: Request, @Param('id', ParseIntPipe) id: number) {
    return this.community.removePost({ postId: id, userId: req.userId! });
  }
}
