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
    findAllByPlan: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
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
      suiteIds: ['suite-1'],
    });

    expect(mockService.create).toHaveBeenCalledWith(PLAN_ID, {
      name: 'Smoke Test',
      suiteIds: ['suite-1'],
    });
    expect(result).toEqual(mockRun);
  });

  it('findAllByPlan delegates to service', async () => {
    mockService.findAllByPlan.mockResolvedValue([mockRun]);

    const result = await controller.findAllByPlan(PLAN_ID);

    expect(mockService.findAllByPlan).toHaveBeenCalledWith(PLAN_ID);
    expect(result).toEqual([mockRun]);
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

  it('remove delegates to service', async () => {
    const deleted = { ...mockRun, deletedAt: new Date() };
    mockService.softDelete.mockResolvedValue(deleted);

    const result = await controller.remove('run-1');

    expect(mockService.softDelete).toHaveBeenCalledWith('run-1');
    expect(result).toEqual(deleted);
  });
});
