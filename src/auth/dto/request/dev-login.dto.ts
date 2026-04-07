import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class DevLoginDto {
  @ApiPropertyOptional({
    description: '本地测试用手机号',
    example: '13900000000',
  })
  @IsOptional()
  @IsString()
  @MinLength(6)
  @MaxLength(32)
  phone?: string;

  @ApiPropertyOptional({
    description: '本地测试用显示名称',
    example: '本地测试用户',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  displayName?: string;
}
