import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AccountSummaryDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiPropertyOptional({ example: '13800138000' })
  phone?: string | null;

  @ApiPropertyOptional({ example: '小杨' })
  displayName?: string | null;

  @ApiProperty({ example: 'active' })
  status!: string;
}
