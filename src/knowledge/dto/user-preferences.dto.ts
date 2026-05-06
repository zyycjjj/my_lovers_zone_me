import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateUserPreferencesDto {
  @ApiPropertyOptional({ example: '种草感', description: '内容风格偏好' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  contentStyle?: string;

  @ApiPropertyOptional({ example: '25-35岁女性', description: '默认目标受众' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  defaultAudience?: string;

  @ApiPropertyOptional({ example: '性价比、日常实用、小众好物', description: '品牌关键词，逗号分隔' })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  brandKeywords?: string;
}
