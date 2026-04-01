import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApiSuccessEnvelopeDto {
  @ApiProperty({ example: 'SUCCESS' })
  code!: string;

  @ApiProperty({ example: '请求成功' })
  message!: string;

  @ApiProperty({ example: 'req_123456' })
  requestId!: string;

  @ApiProperty({ example: '2026-04-01T16:30:00.000Z' })
  timestamp!: string;

  @ApiProperty()
  data!: unknown;
}

export class ApiErrorEnvelopeDto {
  @ApiProperty({
    example: 'UNAUTHORIZED',
  })
  code!: string;

  @ApiProperty({ example: '登录会话不存在' })
  message!: string;

  @ApiProperty({ example: 'req_123456' })
  requestId!: string;

  @ApiProperty({ example: '2026-04-01T16:30:00.000Z' })
  timestamp!: string;

  @ApiPropertyOptional()
  details?: unknown;
}
