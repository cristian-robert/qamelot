import { Test, TestingModule } from '@nestjs/testing';
import { AutomationController } from './automation.controller';
import { AutomationService } from './automation.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AutomationController', () => {
  let controller: AutomationController;
  const mockService = {
    createRun: jest.fn(),
    submitResult: jest.fn(),
    completeRun: jest.fn(),
    listAutomatedCases: jest.fn(),
    syncTests: jest.fn(),
    setupProject: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AutomationController],
      providers: [
        { provide: AutomationService, useValue: mockService },
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();
    controller = module.get<AutomationController>(AutomationController);
  });

  const mockReq = { apiKey: { id: 'key-1', projectId: 'proj-1' } };

  it('createRun delegates to service with apiKey projectId', async () => {
    mockService.createRun.mockResolvedValue({ id: 'run-1' });
    const dto = {
      projectId: 'proj-1',
      planId: 'plan-1',
      name: 'CI Run',
      automationIds: ['test-1'],
    };
    const result = await controller.createRun(dto, mockReq);
    expect(mockService.createRun).toHaveBeenCalledWith(dto, 'proj-1');
    expect(result.id).toBe('run-1');
  });

  it('submitResults delegates each result to service', async () => {
    mockService.submitResult.mockResolvedValue({ id: 'result-1' });
    const dto = {
      results: [{ automationId: 'test-1', status: 'PASSED' as const }],
    };
    const result = await controller.submitResults('run-1', dto, mockReq);
    expect(mockService.submitResult).toHaveBeenCalledWith(
      'run-1',
      dto.results[0],
      'proj-1',
      'key-1',
    );
    expect(result.submitted).toBe(1);
  });

  it('submitResults counts only non-null results as submitted', async () => {
    mockService.submitResult
      .mockResolvedValueOnce({ id: 'result-1' })
      .mockResolvedValueOnce(null);
    const dto = {
      results: [
        { automationId: 'test-1', status: 'PASSED' as const },
        { automationId: 'test-2', status: 'FAILED' as const },
      ],
    };
    const result = await controller.submitResults('run-1', dto, mockReq);
    expect(result.submitted).toBe(1);
    expect(result.total).toBe(2);
  });

  it('completeRun delegates to service', async () => {
    mockService.completeRun.mockResolvedValue({
      id: 'run-1',
      status: 'COMPLETED',
    });
    const result = await controller.completeRun('run-1', mockReq);
    expect(mockService.completeRun).toHaveBeenCalledWith('run-1', 'proj-1');
    expect(result.status).toBe('COMPLETED');
  });

  it('listCases delegates to service', async () => {
    mockService.listAutomatedCases.mockResolvedValue([]);
    const result = await controller.listCases('proj-1');
    expect(mockService.listAutomatedCases).toHaveBeenCalledWith('proj-1');
    expect(result).toEqual([]);
  });

  it('sync delegates to service', async () => {
    mockService.syncTests.mockResolvedValue({
      matched: 1,
      created: 0,
      stale: 0,
      unmatched: [],
    });
    const dto = {
      projectId: 'proj-1',
      tests: [{ automationId: 'a', title: 'A', filePath: 'a.ts' }],
    };
    const result = await controller.sync(dto);
    expect(mockService.syncTests).toHaveBeenCalledWith('proj-1', dto.tests);
    expect(result.matched).toBe(1);
  });

  it('setup delegates to service', async () => {
    mockService.setupProject.mockResolvedValue({
      projectId: 'proj-1',
      planId: 'plan-1',
    });
    const dto = {
      projectName: 'Playwright Integration Test',
      planName: 'Automation Plan',
    };
    const result = await controller.setup(dto);
    expect(mockService.setupProject).toHaveBeenCalledWith(dto);
    expect(result.projectId).toBe('proj-1');
    expect(result.planId).toBe('plan-1');
  });
});
