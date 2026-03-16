import { Test, TestingModule } from '@nestjs/testing';
import { firstValueFrom, take, toArray, Subject } from 'rxjs';
import { TestResultsController } from './test-results.controller';
import { TestResultsService } from './test-results.service';
import { RunEventsService } from '../run-events/run-events.service';
import { TestResultStatus, TestRunStatus } from '@app/shared';
import type { RunProgressEvent } from '@app/shared';

const RUN_ID = 'run-1';
const USER_ID = 'user-1';

const mockResult = {
  id: 'result-1',
  testRunCaseId: 'trc-1',
  testRunId: RUN_ID,
  executedById: USER_ID,
  status: TestResultStatus.PASSED,
  comment: null,
  elapsed: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  executedBy: { id: USER_ID, name: 'Tester', email: 'test@example.com' },
};

const mockRequest = { user: { id: USER_ID, email: 'test@example.com', role: 'TESTER' } };

describe('TestResultsController', () => {
  let controller: TestResultsController;

  const mockService = {
    submit: jest.fn(),
    findAllByRun: jest.fn(),
    getRunWithSummary: jest.fn(),
    update: jest.fn(),
    exportResultsCsv: jest.fn(),
  };

  const mockRunEventsService = {
    getStream: jest.fn(),
    emitUpdate: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TestResultsController],
      providers: [
        { provide: TestResultsService, useValue: mockService },
        { provide: RunEventsService, useValue: mockRunEventsService },
      ],
    }).compile();
    controller = module.get<TestResultsController>(TestResultsController);
  });

  it('submit delegates to service with user id', async () => {
    mockService.submit.mockResolvedValue(mockResult);

    const dto = { testRunCaseId: 'trc-1', status: TestResultStatus.PASSED };
    const result = await controller.submit(RUN_ID, dto, mockRequest);

    expect(mockService.submit).toHaveBeenCalledWith(RUN_ID, USER_ID, dto);
    expect(result).toEqual(mockResult);
  });

  it('findAllByRun delegates to service', async () => {
    mockService.findAllByRun.mockResolvedValue([mockResult]);

    const result = await controller.findAllByRun(RUN_ID);

    expect(mockService.findAllByRun).toHaveBeenCalledWith(RUN_ID);
    expect(result).toEqual([mockResult]);
  });

  it('getExecution delegates to service', async () => {
    const executionData = { id: RUN_ID, summary: { total: 1 } };
    mockService.getRunWithSummary.mockResolvedValue(executionData);

    const result = await controller.getExecution(RUN_ID);

    expect(mockService.getRunWithSummary).toHaveBeenCalledWith(RUN_ID);
    expect(result).toEqual(executionData);
  });

  it('update delegates to service', async () => {
    const updated = { ...mockResult, status: TestResultStatus.FAILED };
    mockService.update.mockResolvedValue(updated);

    const result = await controller.update('result-1', { status: TestResultStatus.FAILED });

    expect(mockService.update).toHaveBeenCalledWith('result-1', {
      status: TestResultStatus.FAILED,
    });
    expect(result).toEqual(updated);
  });

  it('exportResults sends CSV response', async () => {
    const csvContent = 'Suite,Status\nAuth,PASSED\n';
    mockService.exportResultsCsv.mockResolvedValue(csvContent);

    const mockRes = {
      setHeader: jest.fn(),
      send: jest.fn(),
    };

    await controller.exportResults(RUN_ID, mockRes as never);

    expect(mockService.exportResultsCsv).toHaveBeenCalledWith(RUN_ID);
    expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
    expect(mockRes.setHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      `attachment; filename="run-results-${RUN_ID}.csv"`,
    );
    expect(mockRes.send).toHaveBeenCalledWith(csvContent);
  });

  describe('stream (SSE)', () => {
    it('returns observable that emits run events', async () => {
      const subject = new Subject<MessageEvent<RunProgressEvent>>();
      mockRunEventsService.getStream.mockReturnValue(subject.asObservable());

      const stream$ = controller.stream(RUN_ID);
      const resultPromise = firstValueFrom(stream$.pipe(take(1), toArray()));

      const event: RunProgressEvent = {
        runId: RUN_ID,
        summary: { total: 1, passed: 1, failed: 0, blocked: 0, retest: 0, untested: 0 },
        updatedCase: {
          testRunCaseId: 'trc-1',
          latestResult: mockResult as never,
        },
        runStatus: TestRunStatus.COMPLETED,
      };
      subject.next({ data: event } as MessageEvent<RunProgressEvent>);

      const results = await resultPromise;
      expect(results).toHaveLength(1);
      expect(results[0].data).toEqual(event);
      expect(mockRunEventsService.getStream).toHaveBeenCalledWith(RUN_ID);
    });
  });
});
