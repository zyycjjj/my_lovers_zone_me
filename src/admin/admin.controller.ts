import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../auth/admin.guard';
import { AdminService } from './admin.service';

@ApiTags('me')
@ApiBearerAuth('AdminPass')
@Controller('api/me')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('summary')
  @ApiOperation({ summary: '后台汇总' })
  async summary() {
    return this.admin.summary();
  }

  @Get('photos')
  @ApiOperation({ summary: '后台照片列表' })
  async photos(@Query('limit') limit?: string) {
    const take = limit ? Number(limit) : 20;
    return this.admin.photos(Number.isNaN(take) ? 20 : take);
  }

  @Get('users')
  @ApiOperation({ summary: '后台用户列表' })
  async users(@Query('limit') limit?: string) {
    const take = limit ? Number(limit) : 50;
    return this.admin.users(Number.isNaN(take) ? 50 : take);
  }

  @Get('events')
  @ApiOperation({ summary: '操作记录' })
  async events(@Query('limit') limit?: string) {
    const take = limit ? Number(limit) : 100;
    return this.admin.events(Number.isNaN(take) ? 100 : take);
  }

  @Post('seed-users')
  @ApiOperation({ summary: '生成三人 token 与资料' })
  async seedUsers(
    @Body()
    body: {
      meName?: string;
      girlfriendName?: string;
      testName?: string;
    },
  ) {
    return this.admin.seedUsers(body);
  }
}
