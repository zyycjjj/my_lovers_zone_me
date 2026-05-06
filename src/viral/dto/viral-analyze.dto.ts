import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class ViralAnalyzeDto {
  @ApiProperty({ example: 'https://www.xiaohongshu.com/explore/xxxxx', description: '爆款内容链接或内容文本' })
  @IsString()
  @MaxLength(2048)
  source!: string;

  @ApiPropertyOptional({ example: 'xiaohongshu', description: '来源平台', enum: ['xiaohongshu', 'douyin', 'kuaishou', 'other'] })
  @IsOptional()
  @IsIn(['xiaohongshu', 'douyin', 'kuaishou', 'other'])
  sourcePlatform?: 'xiaohongshu' | 'douyin' | 'kuaishou' | 'other';

  @ApiPropertyOptional({ example: '春季连衣裙', description: '你的商品关键词（结合用户知识库生成定制版本）' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  myProduct?: string;

  @ApiPropertyOptional({ example: '小红书', description: '你要发布的平台' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  myPlatform?: string;

  @ApiPropertyOptional({ example: '种草感', description: '风格偏好' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  style?: string;
}
