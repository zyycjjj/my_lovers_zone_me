import { Module } from '@nestjs/common';
import { ContentAssetsController } from './content-assets.controller';
import { ContentAssetsService } from './content-assets.service';

@Module({
  controllers: [ContentAssetsController],
  providers: [ContentAssetsService],
})
export class ContentAssetsModule {}
