import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class SubmitPaymentProofDto {
  @ApiPropertyOptional({ description: '支付流水号或订单号' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  paymentRef?: string;

  @ApiPropertyOptional({ description: '补充备注，如支付时间后四位' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  note?: string;
}
