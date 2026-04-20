import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class PasswordLoginDto {
  @ApiProperty({
    example: '13800138000',
    description: '登录手机号',
  })
  @IsString()
  @MinLength(11)
  @MaxLength(32)
  @Matches(/^1\d{10}$/, {
    message: '请输入正确的 11 位手机号',
  })
  phone!: string;

  @ApiProperty({
    example: 'Memory@2026',
    description: '登录密码',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  password!: string;

  @ApiProperty({
    example: 'a1b2c3d4',
    description: '图形验证码 ID',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  captchaId!: string;

  @ApiProperty({
    example: 'ABCD',
    description: '用户输入的图形验证码',
  })
  @IsString()
  @MinLength(4)
  @MaxLength(8)
  captchaCode!: string;
}
