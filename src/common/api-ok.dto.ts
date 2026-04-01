import { ApiProperty } from '@nestjs/swagger';

export class ApiOkDto {
  @ApiProperty({ example: true })
  ok!: true;
}
