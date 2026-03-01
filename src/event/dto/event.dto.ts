import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class EventDto {
  @ApiProperty({ example: 'button_used' })
  @IsIn(['tool_used', 'signal_sent', 'button_used'])
  type!: 'tool_used' | 'signal_sent' | 'button_used';

  @ApiPropertyOptional({ example: 'love-button' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  key?: string;

  @ApiPropertyOptional({ example: 'user-token' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  targetToken?: string;
}
