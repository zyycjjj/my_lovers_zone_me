import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../auth/admin.guard';
import { AdminService } from './admin.service';

@ApiTags('admin')
@ApiBearerAuth('AdminPass')
@Controller('admin')
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
}
