import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { AdminGuard } from '../auth/admin.guard';
import { UserGuard } from '../auth/user.guard';
import { AdminEchoDto } from './dto/echo.dto';
import { EchoService } from './echo.service';

@ApiTags('echo')
@Controller('api/echo')
export class EchoController {
  constructor(private readonly echoes: EchoService) {}

  @Post()
  @ApiOperation({ summary: '新增一句回声' })
  @ApiBearerAuth('AdminPass')
  @UseGuards(AdminGuard)
  async create(@Body() body: AdminEchoDto) {
    return this.echoes.createByToken(body.token, { text: body.text });
  }

  @Get('latest')
  @ApiOperation({ summary: '最近回声列表' })
  @ApiBearerAuth('UserToken')
  @UseGuards(UserGuard)
  async latest(@Req() req: Request) {
    return this.echoes.latest(req.userId!);
  }

  @Get('profile')
  @ApiOperation({ summary: '获取用户角色' })
  @ApiBearerAuth('UserToken')
  @UseGuards(UserGuard)
  async profile(@Req() req: Request) {
    return this.echoes.profile(req.userId!);
  }
}
