import { ApiProperty } from '@nestjs/swagger';
import { AccountSummaryDto } from './account-summary.dto';
import { RoutingResultDto } from './routing-result.dto';
import { SessionDto } from './session.dto';

export class NumberLoginResponseDto {
  @ApiProperty({ type: AccountSummaryDto })
  account!: AccountSummaryDto;

  @ApiProperty({ type: SessionDto })
  session!: SessionDto;

  @ApiProperty({ type: RoutingResultDto })
  routing!: RoutingResultDto;
}
