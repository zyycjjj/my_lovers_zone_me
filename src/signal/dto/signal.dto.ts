import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class SignalDto {
  @ApiProperty({ example: 'sweet' })
  @IsString()
  @MaxLength(16)
  mood!: string;

  @ApiProperty({ example: 'busy' })
  @IsString()
  @MaxLength(32)
  status!: string;

  @ApiPropertyOptional({ example: '今天有点忙，想你' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  message?: string;
}
