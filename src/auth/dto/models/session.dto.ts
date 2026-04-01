import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SessionDto {
  @ApiProperty({ example: 'session_xxxxx' })
  sessionToken!: string;

  @ApiPropertyOptional({ example: 'refresh_xxxxx' })
  refreshToken?: string | null;

  @ApiProperty({ example: '2026-04-08T10:00:00.000Z' })
  expiredAt!: string;
}
