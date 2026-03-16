import { Injectable, Logger } from '@nestjs/common';
import { Subject, Observable, filter, map } from 'rxjs';
import type { RunProgressEvent } from '@app/shared';

interface InternalRunEvent {
  runId: string;
  data: RunProgressEvent;
}

@Injectable()
export class RunEventsService {
  private readonly logger = new Logger(RunEventsService.name);
  private readonly subject = new Subject<InternalRunEvent>();

  /** Emit a progress event for a specific run */
  emitUpdate(event: RunProgressEvent): void {
    this.logger.log(`Emitting progress event for run ${event.runId}`);
    this.subject.next({ runId: event.runId, data: event });
  }

  /** Get an observable stream of progress events for a specific run */
  getStream(runId: string): Observable<MessageEvent<RunProgressEvent>> {
    return this.subject.pipe(
      filter((event) => event.runId === runId),
      map(
        (event) =>
          ({ data: event.data }) as MessageEvent<RunProgressEvent>,
      ),
    );
  }
}
