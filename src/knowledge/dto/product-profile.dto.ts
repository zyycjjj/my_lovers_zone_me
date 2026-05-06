import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateProductProfileDto {
  @ApiProperty({ example: '春季连衣裙', description: '商品名称' })
  @IsString()
  @MaxLength(128)
  name!: string;

  @ApiPropertyOptional({ example: '服饰', description: '商品类目' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  category?: string;

  @ApiPropertyOptional({ example: '199', description: '价格' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  price?: string;

  @ApiPropertyOptional({ example: '面料舒服、版型显瘦、颜色百搭', description: '卖点' })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  sellingPoints?: string;

  @ApiPropertyOptional({ example: '25-35岁女性', description: '目标受众' })
  @IsOptional()
  @IsString()
  @MaxLength(256)
  targetAudience?: string;

  @ApiPropertyOptional({ example: '小红书', description: '主推平台' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  platform?: string;

  @ApiPropertyOptional({ example: '春季新款，适合通勤', description: '备注' })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  notes?: string;
}

export class UpdateProductProfileDto {
  @ApiPropertyOptional({ example: '春季连衣裙', description: '商品名称' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  name?: string;

  @ApiPropertyOptional({ example: '服饰', description: '商品类目' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  category?: string;

  @ApiPropertyOptional({ example: '199', description: '价格' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  price?: string;

  @ApiPropertyOptional({ example: '面料舒服、版型显瘦、颜色百搭', description: '卖点' })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  sellingPoints?: string;

  @ApiPropertyOptional({ example: '25-35岁女性', description: '目标受众' })
  @IsOptional()
  @IsString()
  @MaxLength(256)
  targetAudience?: string;

  @ApiPropertyOptional({ example: '小红书', description: '主推平台' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  platform?: string;

  @ApiPropertyOptional({ example: '春季新款，适合通勤', description: '备注' })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  notes?: string;
}

export class ProductProfileIdParamDto {
  @ApiProperty({ description: '商品档案ID' })
  @IsInt()
  @Min(1)
  id!: number;
}
