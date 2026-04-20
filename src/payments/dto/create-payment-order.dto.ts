import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export class CreatePaymentOrderDto {
  @ApiProperty({ enum: ['experience', 'pro', 'team'] })
  @IsEnum(['experience', 'pro', 'team'])
  planKey!: 'experience' | 'pro' | 'team';
}
