import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, Max, Min } from 'class-validator';

export class CommissionDto {
  @ApiProperty({ example: 199 })
  @IsNumber()
  @Min(0)
  @Max(1000000)
  price!: number;

  @ApiProperty({ example: 0.2 })
  @IsNumber()
  @Min(0)
  @Max(1)
  commissionRate!: number;

  @ApiPropertyOptional({ example: 0.1 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  platformRate?: number;
}
