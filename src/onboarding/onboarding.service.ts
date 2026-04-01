import { Injectable } from '@nestjs/common';
import { OnboardingDomain } from './onboarding.domain';
import { UpsertOnboardingProfileDto } from './dto/upsert-onboarding-profile.dto';

@Injectable()
export class OnboardingService {
  constructor(private readonly domain: OnboardingDomain) {}

  status(sessionToken: string) {
    return this.domain.getStatus(sessionToken);
  }

  upsertProfile(sessionToken: string, payload: UpsertOnboardingProfileDto) {
    return this.domain.upsertProfile(sessionToken, payload);
  }
}
