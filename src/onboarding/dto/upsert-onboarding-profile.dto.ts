import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpsertOnboardingProfileDto {
  @ApiProperty({ example: '小杨' })
  @IsString()
  @MaxLength(64)
  nickname!: string;

  @ApiPropertyOptional({
    example: '个体商家',
    description: '用户当前的经营身份或业务角色',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  businessRole?: string;

  @ApiPropertyOptional({
    example: '家居百货',
    description: '当前主营类目',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  industry?: string;

  @ApiPropertyOptional({
    example: '先稳定每天发一条',
    description: '当前阶段最想达成的目标',
  })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  currentGoal?: string;

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
