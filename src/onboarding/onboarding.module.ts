import { Module } from '@nestjs/common';
import { OnboardingController } from './controllers/onboarding.controller';
import { OnboardingDomain } from './domain/onboarding.domain';
import { UserProfileRepository } from './repositories/user-profile.repository';
import { OnboardingService } from './services/onboarding.service';
import { AuthApiModule } from '../auth/auth-api.module';
import { WorkspaceModule } from '../workspace/workspace.module';

@Module({
  imports: [AuthApiModule, WorkspaceModule],
  controllers: [OnboardingController],
  providers: [OnboardingService, OnboardingDomain, UserProfileRepository],
  exports: [OnboardingService, OnboardingDomain, UserProfileRepository],
})
export class OnboardingModule {}
