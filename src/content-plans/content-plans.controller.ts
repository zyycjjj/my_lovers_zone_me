import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { ContentPlansService } from './content-plans.service';

@Controller('content-plans')
export class ContentPlansController {
  constructor(private readonly service: ContentPlansService) {}

  private uid(req: Request): number {
    return (req as any).user?.id;
  }

  @Post()
  create(@Req() req: Request, @Body() body: { title?: string; type?: string }) {
    return this.service.create({
      userId: this.uid(req),
      title: body.title,
      type: body.type,
    });
  }

  @Get()
  listMine(
    @Req() req: Request,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.service.listMine({
      userId: this.uid(req),
      status: status as any,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @Get(':id')
  getDetail(@Req() req: Request, @Param('id') id: string) {
    return this.service.getDetail({
      userId: this.uid(req),
      id: parseInt(id, 10),
    });
  }

  @Get(':id/progress')
  getProgress(@Req() req: Request, @Param('id') id: string) {
    return this.service.getProgress({
      planId: parseInt(id, 10),
      userId: this.uid(req),
    });
  }

  @Patch(':id/tasks/:taskId')
  updateTaskStatus(
    @Req() req: Request,
    @Param('id') id: string,
    @Param('taskId') taskId: string,
    @Body() body: { status: string; assetId?: number },
  ) {
    return this.service.updateTaskStatus({
      planId: parseInt(id, 10),
      taskId: parseInt(taskId, 10),
      userId: this.uid(req),
      status: body.status as any,
      assetId: body.assetId,
    });
  }

  @Patch(':id/archive')
  archive(@Req() req: Request, @Param('id') id: string) {
    return this.service.archive({
      userId: this.uid(req),
      id: parseInt(id, 10),
    });
  }

  @Delete(':id')
  delete(@Req() req: Request, @Param('id') id: string) {
    return this.service.delete({
      userId: this.uid(req),
      id: parseInt(id, 10),
    });
  }
}
