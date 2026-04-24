import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateContentAssetDto {
  @ApiProperty({ example: 'script' })
  @IsIn(['title', 'script', 'refine', 'commission'])
  toolKey!: 'title' | 'script' | 'refine' | 'commission';

  @ApiPropertyOptional({ example: '春季连衣裙脚本' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  title?: string;

  @ApiProperty({ example: '完整生成内容...' })
  @IsString()
  content!: string;

  @ApiPropertyOptional({ example: '春季连衣裙上新' })
  @IsOptional()
  @IsString()
  sourcePrompt?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  markCompleted?: boolean;
}
