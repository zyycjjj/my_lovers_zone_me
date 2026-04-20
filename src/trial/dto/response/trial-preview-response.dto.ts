import { ApiProperty } from '@nestjs/swagger';

export class TrialPreviewResponseDto {
  @ApiProperty({
    example: '这是你这轮体验预览',
    description: '体验预览标题',
  })
  title!: string;

  @ApiProperty({
    example:
      '春季新品想要穿出轻盈和松弛感，这条连衣裙可以直接拿来做第一波种草内容。版型对身材很友好，面料上身轻，通勤和周末出门都能穿...',
    description: '可直接展示给用户的预览内容',
  })
  previewText!: string;

  @ApiProperty({
    example: true,
    description: '当前返回是否已经做了截断',
  })
  truncated!: boolean;

  @ApiProperty({
    example: 126,
    description: '仍然被隐藏的字符数量，用于前端提示用户继续查看',
  })
  hiddenChars!: number;

  @ApiProperty({
    example: '登录后继续查看完整内容，并进入你的工作台继续编辑。',
    description: '前端可直接展示的继续引导文案',
  })
  continueHint!: string;
}
