import { Global, Module } from '@nestjs/common';
import { RunEventsService } from './run-events.service';

@Global()
@Module({
  providers: [RunEventsService],
  exports: [RunEventsService],
})
export class RunEventsModule {}
