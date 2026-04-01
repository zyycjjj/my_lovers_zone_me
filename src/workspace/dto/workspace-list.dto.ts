import { ApiProperty } from '@nestjs/swagger';
import { WorkspaceSummaryDto } from './workspace-summary.dto';

export class WorkspaceListDto {
  @ApiProperty({ type: [WorkspaceSummaryDto] })
  items!: WorkspaceSummaryDto[];
}
