import { Module } from '@nestjs/common';
import { EntitlementsModule } from '../entitlements/entitlements.module';
import { ToolController } from './tool.controller';
import { ToolService } from './tool.service';

@Module({
  imports: [EntitlementsModule],
  controllers: [ToolController],
  providers: [ToolService],
})
export class ToolModule {}
