import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OnboardingStatusDto {
  @ApiProperty({ example: false })
  completed!: boolean;

  @ApiProperty({ example: false })
  profileExists!: boolean;

  @ApiPropertyOptional({ example: 1 })
  workspaceId?: number;

  @ApiProperty({ example: 'onboarding' })
  nextStep!: 'onboarding' | 'workspace_home' | 'workspace_select';
}
