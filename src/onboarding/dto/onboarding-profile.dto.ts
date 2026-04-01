import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OnboardingProfileDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 1 })
  accountId!: number;

  @ApiProperty({ example: 1 })
  workspaceId!: number;

  @ApiPropertyOptional({ example: '小杨' })
  nickname?: string | null;

  @ApiPropertyOptional({ example: '家居百货' })
  industry?: string | null;

  @ApiPropertyOptional({ example: '短视频带货' })
  contentDirection?: string | null;

  @ApiPropertyOptional({ example: '抖音' })
  targetPlatform?: string | null;

  @ApiPropertyOptional({ example: 'beginner' })
  experienceLevel?: string | null;

  @ApiPropertyOptional({ example: '2026-04-01T10:00:00.000Z' })
  onboardingCompletedAt?: string | null;
}
