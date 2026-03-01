import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class PhotoDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  signalId?: number;

  @ApiPropertyOptional({ example: 'user-token' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  targetToken?: string;
}
