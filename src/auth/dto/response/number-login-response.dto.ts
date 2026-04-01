import { ApiProperty } from '@nestjs/swagger';
import { AccountSummaryDto } from '../models/account-summary.dto';
import { RoutingResultDto } from '../models/routing-result.dto';
import { SessionDto } from '../models/session.dto';

export class NumberLoginResponseDto {
  @ApiProperty({ type: AccountSummaryDto })
  account!: AccountSummaryDto;

  @ApiProperty({ type: SessionDto })
  session!: SessionDto;

  @ApiProperty({ type: RoutingResultDto })
  routing!: RoutingResultDto;
}
