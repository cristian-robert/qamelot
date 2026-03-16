import { Test, TestingModule } from '@nestjs/testing';
import { firstValueFrom, take, toArray } from 'rxjs';
import { RunEventsService } from './run-events.service';
import { TestRunStatus } from '@app/shared';
import type { RunProgressEvent } from '@app/shared';

const RUN_ID = 'run-1';
const OTHER_RUN_ID = 'run-2';

const makeEvent = (runId: string): RunProgressEvent => ({
  runId,
  summary: { total: 2, passed: 1, failed: 0, blocked: 0, retest: 0, untested: 1 },
  updatedCase: {
    testRunCaseId: 'trc-1',
    latestResult: {
      id: 'result-1',
      testRunCaseId: 'trc-1',
      testRunId: runId,
      executedById: 'user-1',
      executedBy: { id: 'user-1', name: 'Tester', email: 'test@example.com' },
      status: 'PASSED' as never,
      comment: null,
      elapsed: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  },
  runStatus: TestRunStatus.IN_PROGRESS,
});

describe('RunEventsService', () => {
  let service: RunEventsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RunEventsService],
    }).compile();
    service = module.get<RunEventsService>(RunEventsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('emits events to subscribers of a matching runId', async () => {
    const event = makeEvent(RUN_ID);
    const resultPromise = firstValueFrom(service.getStream(RUN_ID));

    service.emitUpdate(event);

    const result = await resultPromise;
    expect(result.data).toEqual(event);
  });

  it('filters events by runId — no cross-talk', async () => {
    const stream$ = service.getStream(RUN_ID).pipe(take(1), toArray());
    const resultPromise = firstValueFrom(stream$);

    // Emit for a different run — should not arrive
    service.emitUpdate(makeEvent(OTHER_RUN_ID));
    // Then emit for matching run
    service.emitUpdate(makeEvent(RUN_ID));

    const results = await resultPromise;
    expect(results).toHaveLength(1);
    expect(results[0].data.runId).toBe(RUN_ID);
  });

  it('delivers multiple events in order', async () => {
    const stream$ = service.getStream(RUN_ID).pipe(take(2), toArray());
    const resultPromise = firstValueFrom(stream$);

    const event1 = makeEvent(RUN_ID);
    const event2 = {
      ...makeEvent(RUN_ID),
      summary: { total: 2, passed: 2, failed: 0, blocked: 0, retest: 0, untested: 0 },
      runStatus: TestRunStatus.COMPLETED,
    };

    service.emitUpdate(event1);
    service.emitUpdate(event2);

    const results = await resultPromise;
    expect(results).toHaveLength(2);
    expect(results[0].data.summary.passed).toBe(1);
    expect(results[1].data.summary.passed).toBe(2);
  });
});
