import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { UserGuard } from '../auth/user.guard';
import { CommissionDto } from './dto/commission.dto';
import { GenerateScriptDto } from './dto/generate-script.dto';
import { GenerateTitleDto } from './dto/generate-title.dto';
import { RefineTalkDto } from './dto/refine-talk.dto';
import { ToolService } from './tool.service';

@ApiTags('tool')
@ApiBearerAuth('UserToken')
@Controller('api/tool')
@UseGuards(UserGuard)
export class ToolController {
  constructor(private readonly tools: ToolService) {}

  @Post('script')
  @ApiOperation({ summary: '生成带货脚本' })
  async script(@Req() req: Request, @Body() body: GenerateScriptDto) {
    return this.tools.generateScript(req.userId!, body);
  }

  @Post('title')
  @ApiOperation({ summary: '生成标题' })
  async title(@Req() req: Request, @Body() body: GenerateTitleDto) {
    return this.tools.generateTitle(req.userId!, body);
  }

  @Post('refine')
  @ApiOperation({ summary: '话术提炼与合规检查' })
  async refine(@Req() req: Request, @Body() body: RefineTalkDto) {
    return this.tools.refineTalk(req.userId!, body);
  }

  @Post('commission')
  @ApiOperation({ summary: '佣金计算' })
  async commission(@Req() req: Request, @Body() body: CommissionDto) {
    return this.tools.commission(req.userId!, body);
  }
}
