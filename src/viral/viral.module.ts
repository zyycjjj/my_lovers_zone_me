import { Module } from '@nestjs/common';
import { EntitlementsModule } from '../entitlements/entitlements.module';
import { KnowledgeModule } from '../knowledge/knowledge.module';
import { ViralController } from './viral.controller';
import { ViralService } from './viral.service';

@Module({
  imports: [EntitlementsModule, KnowledgeModule],
  controllers: [ViralController],
  providers: [ViralService],
})
export class ViralModule {}
