import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class LogoutDto {
  @ApiPropertyOptional({
    example: false,
    description: '是否退出当前账号的全部设备',
  })
  @IsOptional()
  @IsBoolean()
  allDevices?: boolean;
}
