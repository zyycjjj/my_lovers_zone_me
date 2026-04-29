import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  Delete,
  Patch,
} from '@nestjs/common';
import { ContentPlansService } from './content-plans.service';

@Controller('content-plans')
export class ContentPlansController {
  constructor(private readonly service: ContentPlansService) {}

  @Post()
  create(@Req() req, @Body() body: { title?: string; type?: string }) {
    return this.service.create({
      userId: req.user?.id,
      title: body.title,
      type: body.type,
    });
  }

  @Get()
  listMine(
    @Req() req,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.service.listMine({
      userId: req.user?.id,
      status: status as any,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @Get(':id')
  getDetail(@Req() req, @Param('id') id: string) {
    return this.service.getDetail({
      userId: req.user?.id,
      id: parseInt(id, 10),
    });
  }

  @Get(':id/progress')
  getProgress(@Req() req, @Param('id') id: string) {
    return this.service.getProgress({
      userId: req.user?.id,
      id: parseInt(id, 10),
    });
  }

  @Patch(':id/tasks/:taskId')
  updateTaskStatus(
    @Req() req,
    @Param('id') id: string,
    @Param('taskId') taskId: string,
    @Body() body: { status: string; assetId?: number },
  ) {
    return this.service.updateTaskStatus({
      planId: parseInt(id, 10),
      taskId: parseInt(taskId, 10),
      userId: req.user?.id,
      status: body.status as any,
      assetId: body.assetId,
    });
  }

  @Patch(':id/archive')
  archive(@Req() req, @Param('id') id: string) {
    return this.service.archive({
      userId: req.user?.id,
      id: parseInt(id, 10),
    });
  }

  @Delete(':id')
  delete(@Req() req, @Param('id') id: string) {
    return this.service.delete({
      userId: req.user?.id,
      id: parseInt(id, 10),
    });
  }
}
