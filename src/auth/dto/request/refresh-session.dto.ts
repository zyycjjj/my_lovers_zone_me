import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class RefreshSessionDto {
  @ApiPropertyOptional({
    example: 'refresh_xxxxx',
    description: '刷新会话使用的 refresh token，后续也可走 cookie',
  })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  refreshToken?: string;

  @ApiPropertyOptional({
    example: false,
    description: '是否同时轮换 refresh token',
  })
  @IsOptional()
  @IsBoolean()
  rotateRefreshToken?: boolean;
}
