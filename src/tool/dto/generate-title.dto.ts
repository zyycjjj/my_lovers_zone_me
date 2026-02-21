import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class GenerateTitleDto {
  @ApiProperty({ example: '玻璃杯' })
  @IsString()
  keyword!: string;

  @ApiPropertyOptional({ example: '小红书风' })
  @IsOptional()
  @IsString()
  style?: string;
}
