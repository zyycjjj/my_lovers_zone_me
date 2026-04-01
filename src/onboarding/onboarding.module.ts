import { Module } from '@nestjs/common';
import { OnboardingController } from './onboarding.controller';
import { OnboardingDomain } from './onboarding.domain';
import { UserProfileRepository } from './repositories/user-profile.repository';
import { OnboardingService } from './onboarding.service';
import { AuthModule } from '../auth/auth.module';
import { WorkspaceModule } from '../workspace/workspace.module';

@Module({
  imports: [AuthModule, WorkspaceModule],
  controllers: [OnboardingController],
  providers: [OnboardingService, OnboardingDomain, UserProfileRepository],
  exports: [OnboardingService, OnboardingDomain, UserProfileRepository],
})
export class OnboardingModule {}
