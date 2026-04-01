import { ApiProperty } from '@nestjs/swagger';
import { RoutingResultDto } from '../../auth/dto/routing-result.dto';
import { OnboardingProfileDto } from './onboarding-profile.dto';

export class UpsertOnboardingProfileResponseDto {
  @ApiProperty({ type: OnboardingProfileDto })
  profile!: OnboardingProfileDto;

  @ApiProperty({ type: RoutingResultDto })
  routing!: RoutingResultDto;
}
