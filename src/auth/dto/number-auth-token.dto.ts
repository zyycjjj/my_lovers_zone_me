import { ApiProperty } from '@nestjs/swagger';

export class NumberAuthTokenDto {
  @ApiProperty({ example: 'agag****' })
  accessToken!: string;

  @ApiProperty({ example: 'aweghd****' })
  jwtToken!: string;

  @ApiProperty({ example: '2026-04-01T10:10:00.000Z' })
  accessTokenExpiredAt!: string;

  @ApiProperty({ example: '2026-04-01T11:00:00.000Z' })
  jwtTokenExpiredAt!: string;
}
