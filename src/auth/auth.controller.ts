import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { SessionAuthGuard } from './guards/session-auth.guard';
import { AuthService } from './auth.service';
import { ApiExceptionFilter } from '../common/api-exception.filter';
import { ApiOkDto } from '../common/api-ok.dto';
import { ApiResponseInterceptor } from '../common/api-response.interceptor';
import { ApiSuccessResponse } from '../common/api-success-response.decorator';
import { AuthMeDto } from './dto/response/auth-me.dto';
import { LogoutDto } from './dto/request/logout.dto';
import { NumberAuthTokenDto } from './dto/response/number-auth-token.dto';
import { NumberLoginDto } from './dto/request/number-login.dto';
import { NumberLoginResponseDto } from './dto/response/number-login-response.dto';
import { RefreshSessionDto } from './dto/request/refresh-session.dto';
import { RoutingResultDto } from './dto/models/routing-result.dto';
import { SessionDto } from './dto/models/session.dto';

@ApiTags('auth')
@Controller('api/auth')
@UseFilters(ApiExceptionFilter)
@UseInterceptors(ApiResponseInterceptor)
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Get('number-auth-token')
  @ApiOperation({ summary: '获取号码认证鉴权 token' })
  @ApiSuccessResponse(NumberAuthTokenDto)
  async getNumberAuthToken() {
    return this.auth.getNumberAuthToken();
  }

  @Post('number-login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '号码认证登录' })
  @ApiBody({ type: NumberLoginDto })
  @ApiSuccessResponse(NumberLoginResponseDto)
  async numberLogin(@Body() body: NumberLoginDto) {
    return this.auth.numberLogin(body);
  }

  @Get('me')
  @UseGuards(SessionAuthGuard)
  @ApiOperation({ summary: '获取当前登录态' })
  @ApiBearerAuth('SessionToken')
  @ApiSuccessResponse(AuthMeDto)
  async me(@Req() req: Request) {
    return this.auth.me(req.sessionToken!);
  }

  @Get('routing')
  @UseGuards(SessionAuthGuard)
  @ApiOperation({ summary: '获取登录后分流结果' })
  @ApiBearerAuth('SessionToken')
  @ApiSuccessResponse(RoutingResultDto)
  async routing(@Req() req: Request) {
    return this.auth.routing(req.sessionToken!);
  }

  @Post('session/refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '刷新会话' })
  @ApiBody({ type: RefreshSessionDto })
  @ApiSuccessResponse(SessionDto)
  async refresh(@Req() req: Request, @Body() body: RefreshSessionDto) {
    return this.auth.refresh(req.sessionToken ?? '', body);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(SessionAuthGuard)
  @ApiOperation({ summary: '退出登录' })
  @ApiBearerAuth('SessionToken')
  @ApiBody({ type: LogoutDto })
  @ApiSuccessResponse(ApiOkDto)
  async logout(@Req() req: Request, @Body() body: LogoutDto) {
    return this.auth.logout(req.sessionToken!, body);
  }
}
