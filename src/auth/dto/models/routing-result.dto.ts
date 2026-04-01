import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RoutingResultDto {
  @ApiProperty({ example: 'onboarding' })
  routeType!: 'onboarding' | 'workspace_home' | 'workspace_select';

  @ApiPropertyOptional({ example: 1 })
  workspaceId?: number;

  @ApiProperty({ example: '首次登录，尚未完成建档' })
  reason!: string;
}
