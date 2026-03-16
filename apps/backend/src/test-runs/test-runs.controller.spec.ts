import { Test, TestingModule } from '@nestjs/testing';
import { TestRunsController } from './test-runs.controller';
import { TestRunsService } from './test-runs.service';

const PLAN_ID = 'plan-1';

const mockRun = {
  id: 'run-1',
  name: 'Smoke Test',
  testPlanId: PLAN_ID,
  projectId: 'proj-1',
  assignedToId: null,
  status: 'PENDING',
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('TestRunsController', () => {
  let controller: TestRunsController;

  const mockService = {
    create: jest.fn(),
    createMatrixRuns: jest.fn(),
    findAllByPlan: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    closeRun: jest.fn(),
    rerun: jest.fn(),
    softDelete: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TestRunsController],
      providers: [{ provide: TestRunsService, useValue: mockService }],
    }).compile();
    controller = module.get<TestRunsController>(TestRunsController);
  });

  it('create delegates to service', async () => {
    mockService.create.mockResolvedValue(mockRun);

    const result = await controller.create(PLAN_ID, {
      name: 'Smoke Test',
      caseIds: ['case-1'],
    });

    expect(mockService.create).toHaveBeenCalledWith(PLAN_ID, {
      name: 'Smoke Test',
      caseIds: ['case-1'],
    });
    expect(result).toEqual(mockRun);
  });

  it('createMatrixRuns delegates to service', async () => {
    const matrixRuns = [{ ...mockRun, configLabel: 'Chrome / Windows' }];
    mockService.createMatrixRuns.mockResolvedValue(matrixRuns);

    const dto = {
      name: 'Matrix Run',
      caseIds: ['case-1'],
      configItemIds: [['item-1', 'item-2']],
    };
    const result = await controller.createMatrixRuns(PLAN_ID, dto);

    expect(mockService.createMatrixRuns).toHaveBeenCalledWith(PLAN_ID, dto);
    expect(result).toEqual(matrixRuns);
  });

  it('findAllByPlan delegates to service without filters', async () => {
    mockService.findAllByPlan.mockResolvedValue([mockRun]);

    const result = await controller.findAllByPlan(PLAN_ID);

    expect(mockService.findAllByPlan).toHaveBeenCalledWith(PLAN_ID, {
      status: undefined,
      assigneeId: undefined,
    });
    expect(result).toEqual([mockRun]);
  });

  it('findAllByPlan passes status and assigneeId filters', async () => {
    mockService.findAllByPlan.mockResolvedValue([]);

    await controller.findAllByPlan(PLAN_ID, 'PENDING', 'user-1');

    expect(mockService.findAllByPlan).toHaveBeenCalledWith(PLAN_ID, {
      status: 'PENDING',
      assigneeId: 'user-1',
    });
  });

  it('findOne delegates to service', async () => {
    mockService.findOne.mockResolvedValue(mockRun);

    const result = await controller.findOne('run-1');

    expect(mockService.findOne).toHaveBeenCalledWith('run-1');
    expect(result).toEqual(mockRun);
  });

  it('update delegates to service', async () => {
    const updated = { ...mockRun, name: 'Renamed' };
    mockService.update.mockResolvedValue(updated);

    const result = await controller.update('run-1', { name: 'Renamed' });

    expect(mockService.update).toHaveBeenCalledWith('run-1', { name: 'Renamed' });
    expect(result).toEqual(updated);
  });

  it('close delegates to service', async () => {
    const closed = { ...mockRun, status: 'COMPLETED' };
    mockService.closeRun.mockResolvedValue(closed);

    const result = await controller.close('run-1');

    expect(mockService.closeRun).toHaveBeenCalledWith('run-1');
    expect(result).toEqual(closed);
  });

  it('rerun delegates to service', async () => {
    const rerun = { ...mockRun, id: 'run-2', sourceRunId: 'run-1' };
    mockService.rerun.mockResolvedValue(rerun);

    const result = await controller.rerun('run-1');

    expect(mockService.rerun).toHaveBeenCalledWith('run-1');
    expect(result).toEqual(rerun);
  });

  it('remove delegates to service', async () => {
    const deleted = { ...mockRun, deletedAt: new Date() };
    mockService.softDelete.mockResolvedValue(deleted);

    const result = await controller.remove('run-1');

    expect(mockService.softDelete).toHaveBeenCalledWith('run-1');
    expect(result).toEqual(deleted);
  });
});
