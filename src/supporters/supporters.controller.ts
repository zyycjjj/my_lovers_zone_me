import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
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
import { SupportersService } from './supporters.service';

@ApiTags('supporters')
@ApiBearerAuth('UserToken')
@Controller('api/supporters')
@UseGuards(UserGuard)
@UseFilters(ApiExceptionFilter)
@UseInterceptors(ApiResponseInterceptor)
export class SupportersController {
  constructor(private readonly supporters: SupportersService) {}

  @Get()
  @ApiOperation({ summary: '我的支持者和我支持的人' })
  listMine(@Req() req: Request) {
    return this.supporters.listMine({
      userId: req.userId!,
      accountId: req.accountId,
    });
  }

  @Post('invitations')
  @ApiOperation({ summary: '创建支持者邀请' })
  createInvitation(
    @Req() req: Request,
    @Body()
    body: {
      supporterName: string;
      supporterContact?: string;
      note?: string;
    },
  ) {
    return this.supporters.createInvitation({
      userId: req.userId!,
      accountId: req.accountId,
      supporterName: body.supporterName,
      supporterContact: body.supporterContact,
      note: body.note,
    });
  }

  @Get('invitations/:code')
  @ApiOperation({ summary: '查看支持者邀请' })
  getInvitation(@Param('code') code: string) {
    return this.supporters.getInvitation(code);
  }

  @Post('invitations/:code/accept')
  @ApiOperation({ summary: '接受支持者邀请' })
  acceptInvitation(@Req() req: Request, @Param('code') code: string) {
    return this.supporters.acceptInvitation({
      inviteCode: code,
      accountId: req.accountId,
    });
  }

  @Post('connections/:id/share')
  @ApiOperation({ summary: '向支持者分享内容' })
  shareAsset(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { assetId: number; note?: string },
  ) {
    return this.supporters.shareAsset({
      connectionId: id,
      assetId: body.assetId,
      userId: req.userId!,
      accountId: req.accountId,
      note: body.note,
    });
  }

  @Get('shared-with-me')
  @ApiOperation({ summary: '别人分享给我的内容' })
  listSharedWithMe(@Req() req: Request) {
    return this.supporters.listSharedWithMe({ accountId: req.accountId });
  }

  @Delete('connections/:id')
  @ApiOperation({ summary: '移除支持者关系' })
  removeConnection(@Req() req: Request, @Param('id', ParseIntPipe) id: number) {
    return this.supporters.removeConnection({
      connectionId: id,
      userId: req.userId!,
    });
  }
}
