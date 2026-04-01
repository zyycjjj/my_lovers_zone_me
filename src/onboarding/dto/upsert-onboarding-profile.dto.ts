import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpsertOnboardingProfileDto {
  @ApiProperty({ example: '小杨' })
  @IsString()
  @MaxLength(64)
  nickname!: string;

  @ApiPropertyOptional({ example: '家居百货' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  industry?: string;

  @ApiPropertyOptional({ example: '短视频带货' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  contentDirection?: string;

  @ApiPropertyOptional({ example: '抖音' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  targetPlatform?: string;

  @ApiPropertyOptional({ example: 'beginner' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  experienceLevel?: string;
}
