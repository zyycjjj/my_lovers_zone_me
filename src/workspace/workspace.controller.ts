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
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { ApiExceptionFilter } from '../common/api-exception.filter';
import { ApiResponseInterceptor } from '../common/api-response.interceptor';
import { ApiSuccessResponse } from '../common/api-success-response.decorator';
import { WorkspaceListDto } from './dto/workspace-list.dto';
import { WorkspaceSummaryDto } from './dto/workspace-summary.dto';
import { WorkspaceService } from './workspace.service';

@ApiTags('workspace')
@ApiBearerAuth('SessionToken')
@Controller('api/workspaces')
@UseGuards(SessionAuthGuard)
@UseFilters(ApiExceptionFilter)
@UseInterceptors(ApiResponseInterceptor)
export class WorkspaceController {
  constructor(private readonly workspaces: WorkspaceService) {}

  @Get()
  @ApiOperation({ summary: '获取我的工作空间列表' })
  @ApiSuccessResponse(WorkspaceListDto)
  async list(@Req() req: Request) {
    return this.workspaces.list(req.sessionToken!);
  }

  @Get('current')
  @ApiOperation({ summary: '获取当前工作空间' })
  @ApiSuccessResponse(WorkspaceSummaryDto)
  async current(@Req() req: Request) {
    return this.workspaces.current(req.sessionToken!);
  }
}
