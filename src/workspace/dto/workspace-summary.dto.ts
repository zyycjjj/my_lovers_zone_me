import { ApiProperty } from '@nestjs/swagger';

export class WorkspaceSummaryDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: '我的空间' })
  name!: string;

  @ApiProperty({ example: 'personal' })
  type!: string;

  @ApiProperty({ example: 'owner' })
  role!: string;

  @ApiProperty({ example: 'active' })
  status!: string;
}
