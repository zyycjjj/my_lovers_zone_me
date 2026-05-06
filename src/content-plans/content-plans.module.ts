import { Module } from '@nestjs/common';
import { KnowledgeModule } from '../knowledge/knowledge.module';
import { ContentPlansController } from './content-plans.controller';
import { ContentPlansService } from './content-plans.service';

@Module({
  imports: [KnowledgeModule],
  controllers: [ContentPlansController],
  providers: [ContentPlansService],
})
export class ContentPlansModule {}
