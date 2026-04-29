import { Module } from '@nestjs/common';
import { ContentPlansController } from './content-plans.controller';
import { ContentPlansService } from './content-plans.service';

@Module({
  controllers: [ContentPlansController],
  providers: [ContentPlansService],
})
export class ContentPlansModule {}
