import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { WorkspaceListDto } from './dto/workspace-list.dto';
import { WorkspaceSummaryDto } from './dto/workspace-summary.dto';
import { WorkspaceService } from './workspace.service';

@ApiTags('workspace')
@ApiBearerAuth('SessionToken')
@Controller('api/workspaces')
@UseGuards(SessionAuthGuard)
export class WorkspaceController {
  constructor(private readonly workspaces: WorkspaceService) {}

  @Get()
  @ApiOperation({ summary: '获取我的工作空间列表' })
  @ApiOkResponse({ type: WorkspaceListDto })
  async list(@Req() req: Request) {
    return this.workspaces.list(req.sessionToken!);
  }

  @Get('current')
  @ApiOperation({ summary: '获取当前工作空间' })
  @ApiOkResponse({ type: WorkspaceSummaryDto })
  async current(@Req() req: Request) {
    return this.workspaces.current(req.sessionToken!);
  }
}
