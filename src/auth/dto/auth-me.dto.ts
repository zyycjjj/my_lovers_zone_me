import { ApiProperty } from '@nestjs/swagger';
import { AccountSummaryDto } from './account-summary.dto';
import { WorkspaceSummaryDto } from '../../workspace/dto/workspace-summary.dto';

export class AuthMeDto {
  @ApiProperty({ type: AccountSummaryDto })
  account!: AccountSummaryDto;

  @ApiProperty({ type: WorkspaceSummaryDto, nullable: true })
  currentWorkspace!: WorkspaceSummaryDto | null;

  @ApiProperty({ example: false })
  onboardingCompleted!: boolean;
}
