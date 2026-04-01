import { Injectable, NotImplementedException } from '@nestjs/common';
import { UpsertOnboardingProfileDto } from '../dto/upsert-onboarding-profile.dto';

@Injectable()
export class OnboardingDomain {
  async getStatus(_sessionToken: string) {
    throw new NotImplementedException('建档状态查询待实现');
  }

  async upsertProfile(
    _sessionToken: string,
    _payload: UpsertOnboardingProfileDto,
  ) {
    throw new NotImplementedException('首次建档提交待实现');
  }
}
