import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class NumberLoginDto {
  @ApiProperty({
    example: 'Dfafdafad542****',
    description: '前端通过阿里云 H5 号码认证 SDK 获取的 SpToken',
  })
  @IsString()
  @MaxLength(1024)
  spToken!: string;
}
