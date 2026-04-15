import { ApiProperty } from '@nestjs/swagger';

export class PasswordCaptchaDto {
  @ApiProperty({ example: 'a1b2c3d4' })
  captchaId!: string;

  @ApiProperty({
    example: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iLi4uIi8+',
    description: '可直接作为 img src 使用的图形验证码 data URI',
  })
  imageData!: string;

  @ApiProperty({ example: '2026-04-15T10:10:00.000Z' })
  expiredAt!: string;
}
