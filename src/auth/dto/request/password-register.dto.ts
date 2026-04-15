import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class PasswordRegisterDto {
  @ApiProperty({
    example: '13800138000',
    description: '注册手机号',
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
    description: '注册密码，建议使用大小写字母、数字和符号组合',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  password!: string;

  @ApiPropertyOptional({
    example: '小杨',
    description: '显示名称，可选',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  displayName?: string;

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
