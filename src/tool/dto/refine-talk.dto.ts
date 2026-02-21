import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class RefineTalkDto {
  @ApiProperty({ example: '这款护肤品效果很强，七天见效。' })
  @IsString()
  @MaxLength(20000)
  text!: string;
}
