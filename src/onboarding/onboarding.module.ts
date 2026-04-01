import { Module } from '@nestjs/common';
import { OnboardingController } from './controllers/onboarding.controller';
import { OnboardingDomain } from './domain/onboarding.domain';
import { UserProfileRepository } from './repositories/user-profile.repository';
import { OnboardingService } from './services/onboarding.service';

@Module({
  controllers: [OnboardingController],
  providers: [OnboardingService, OnboardingDomain, UserProfileRepository],
  exports: [OnboardingService, OnboardingDomain, UserProfileRepository],
})
export class OnboardingModule {}
