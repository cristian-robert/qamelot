import { Test, TestingModule } from '@nestjs/testing';
import { TestResultsController } from './test-results.controller';
import { TestResultsService } from './test-results.service';
import { TestResultStatus } from '@app/shared';

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
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TestResultsController],
      providers: [{ provide: TestResultsService, useValue: mockService }],
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
});
