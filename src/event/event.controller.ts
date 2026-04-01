import {
  BadRequestException,
  Body,
  Controller,
  MessageEvent,
  Post,
  Req,
  Sse,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { Observable, map } from 'rxjs';
import { UserGuard } from '../auth/guards/user.guard';
import { getDateKey } from '../common/date';
import { EventDto } from './dto/event.dto';
import { EventService } from './event.service';

@ApiTags('event')
@Controller('api/event')
export class EventController {
  constructor(private readonly events: EventService) {}

  @Post()
  @ApiOperation({ summary: '记录事件' })
  @ApiBearerAuth('UserToken')
  @UseGuards(UserGuard)
  async record(@Req() req: Request, @Body() body: EventDto) {
    if (body.type !== 'signal_sent' && !body.key) {
      throw new BadRequestException('Missing key');
    }
    const date = getDateKey();
    await this.events.recordEvent(
      req.userId!,
      body.type,
      body.key ?? '',
      date,
      body.targetToken,
    );
    if (body.type === 'button_used') {
      this.events.emitActivity({
        type: 'button_used',
        key: body.key ?? '',
        userId: req.userId!,
        occurredAt: new Date().toISOString(),
      });
    }
    return { ok: true };
  }

  @Sse('stream')
  @ApiOperation({ summary: '事件实时流' })
  @ApiBearerAuth('AdminPass')
  activityStream(@Req() req: Request): Observable<MessageEvent> {
    const adminPass = process.env['ADMIN_PASS'];
    if (adminPass) {
      const providedHeader = req.get('x-admin-pass');
      const rawQuery = req.query?.['adminPass'];
      const providedQuery =
        typeof rawQuery === 'string'
          ? rawQuery
          : Array.isArray(rawQuery)
            ? rawQuery[0]
            : undefined;
      if (providedHeader !== adminPass && providedQuery !== adminPass) {
        throw new UnauthorizedException('Unauthorized');
      }
    }
    return this.events.activityStream().pipe(map((data) => ({ data })));
  }
}
