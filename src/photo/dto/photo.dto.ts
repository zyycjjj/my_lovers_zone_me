import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional } from 'class-validator';

export class PhotoDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  signalId?: number;
}
