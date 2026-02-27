import { Global, Module } from '@nestjs/common';
import { EventController } from './event.controller';
import { EventService } from './event.service';

@Global()
@Module({
  controllers: [EventController],
  providers: [EventService],
  exports: [EventService],
})
export class EventModule {}
