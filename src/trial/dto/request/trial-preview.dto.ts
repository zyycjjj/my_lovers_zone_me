import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class TrialPreviewDto {
  @ApiProperty({
    example:
      '帮我写一篇春季新品发布的小红书文案，产品是连衣裙，强调设计感和舒适度。',
    description: '体验页输入的创作需求',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(500)
  prompt!: string;
}
