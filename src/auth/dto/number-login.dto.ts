import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class NumberLoginDto {
  @ApiProperty({
    example: 'STS.xxxxx',
    description: '前端通过阿里云 H5 号码认证获取的 accessToken',
  })
  @IsString()
  @MaxLength(1024)
  accessToken!: string;
}
