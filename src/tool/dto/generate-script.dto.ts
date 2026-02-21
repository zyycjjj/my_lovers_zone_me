import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class GenerateScriptDto {
  @ApiProperty({ example: '玻璃杯' })
  @IsString()
  keyword!: string;

  @ApiPropertyOptional({ example: 39.9 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1000000)
  price?: number;

  @ApiPropertyOptional({ example: '年轻女性' })
  @IsOptional()
  @IsString()
  audience?: string;

  @ApiPropertyOptional({ example: '居家场景' })
  @IsOptional()
  @IsString()
  scene?: string;

  @ApiPropertyOptional({ example: 'short' })
  @IsOptional()
  @IsIn(['short', 'live'])
  style?: 'short' | 'live';
}
