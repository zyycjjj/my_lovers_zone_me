import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { UserGuard } from '../auth/user.guard';
import { EchoDto } from './dto/echo.dto';
import { EchoService } from './echo.service';

@ApiTags('echo')
@ApiBearerAuth('UserToken')
@Controller('echo')
@UseGuards(UserGuard)
export class EchoController {
  constructor(private readonly echoes: EchoService) {}

  @Post()
  @ApiOperation({ summary: '新增一句回声' })
  async create(@Req() req: Request, @Body() body: EchoDto) {
    return this.echoes.create(req.userId!, body);
  }

  @Get('latest')
  @ApiOperation({ summary: '最近回声列表' })
  async latest(@Req() req: Request) {
    return this.echoes.latest(req.userId!);
  }
}
