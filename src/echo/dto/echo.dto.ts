import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class EchoDto {
  @ApiProperty({ example: '记得吃饭，我在。' })
  @IsString()
  @MaxLength(30)
  text!: string;
}
