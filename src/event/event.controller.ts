import {
  BadRequestException,
  Body,
  Controller,
  Get,
  MessageEvent,
  Post,
  Query,
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
import { PrismaService } from '../prisma/prisma.service';
import { EventDto } from './dto/event.dto';
import { EventService } from './event.service';

@ApiTags('event')
@Controller('api/event')
export class EventController {
  constructor(
    private readonly events: EventService,
    private readonly prisma: PrismaService,
  ) {}

  private parseCsv(raw?: string) {
    return (raw || '')
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
  }

  private async ensureAdminBySession(sessionToken?: string) {
    if (!sessionToken) throw new UnauthorizedException('Unauthorized');

    const session = await this.prisma.authSession.findUnique({
      where: { sessionToken },
      select: { accountId: true, expiredAt: true },
    });
    if (!session || session.expiredAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('Unauthorized');
    }

    const allowIds = this.parseCsv(process.env['ADMIN_ACCOUNT_IDS']);
    const allowPhones = this.parseCsv(process.env['ADMIN_ACCOUNT_PHONES']);
    if (!allowIds.length && !allowPhones.length) {
      throw new UnauthorizedException('Unauthorized');
    }
    if (allowIds.includes(String(session.accountId))) return;

    const account = await this.prisma.account.findUnique({
      where: { id: session.accountId },
      select: { phone: true },
    });
    if (account?.phone && allowPhones.includes(account.phone)) return;
    throw new UnauthorizedException('Unauthorized');
  }

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
  @ApiBearerAuth('SessionToken')
  async activityStream(@Req() req: Request): Promise<Observable<MessageEvent>> {
    const rawQuery = req.query?.['sessionToken'];
    const querySessionToken =
      typeof rawQuery === 'string'
        ? rawQuery
        : Array.isArray(rawQuery)
          ? rawQuery[0]
          : undefined;
    const sessionToken = (
      req.get('x-session-token') ||
      querySessionToken ||
      (typeof req.cookies?.['session_token'] === 'string'
        ? req.cookies['session_token']
        : undefined)
    )?.toString();
    await this.ensureAdminBySession(sessionToken);
    return this.events.activityStream().pipe(map((data) => ({ data })));
  }

  @Get('stats/me')
  @ApiOperation({ summary: '获取我的行为统计' })
  @ApiBearerAuth('UserToken')
  @UseGuards(UserGuard)
  async getMyStats(
    @Req() req: Request,
    @Query('days') days?: string,
  ) {
    return this.events.getUserBehaviorStats(
      req.userId!,
      days ? parseInt(days, 10) : 30,
    );
  }

  @Get('trend/me')
  @ApiOperation({ summary: '获取每日活跃趋势' })
  @ApiBearerAuth('UserToken')
  @UseGuards(UserGuard)
  async getMyTrend(
    @Req() req: Request,
    @Query('days') days?: string,
  ) {
    return this.events.getDailyTrend(
      req.userId!,
      days ? parseInt(days, 10) : 7,
    );
  }
}
