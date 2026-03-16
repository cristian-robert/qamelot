import { Test, TestingModule } from '@nestjs/testing';
import { TestPlansController } from './test-plans.controller';
import { TestPlansService } from './test-plans.service';

const PROJECT_ID = 'proj-1';

const mockPlan = {
  id: 'plan-1',
  name: 'Sprint 1 Plan',
  description: null,
  projectId: PROJECT_ID,
  status: 'DRAFT',
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('TestPlansController', () => {
  let controller: TestPlansController;

  const mockService = {
    create: jest.fn(),
    findAllByProject: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TestPlansController],
      providers: [{ provide: TestPlansService, useValue: mockService }],
    }).compile();
    controller = module.get<TestPlansController>(TestPlansController);
  });

  it('create delegates to service', async () => {
    mockService.create.mockResolvedValue(mockPlan);

    const result = await controller.create(PROJECT_ID, { name: 'Sprint 1 Plan' });

    expect(mockService.create).toHaveBeenCalledWith(PROJECT_ID, { name: 'Sprint 1 Plan' });
    expect(result).toEqual(mockPlan);
  });

  it('findAll delegates to service', async () => {
    mockService.findAllByProject.mockResolvedValue([mockPlan]);

    const result = await controller.findAll(PROJECT_ID);

    expect(mockService.findAllByProject).toHaveBeenCalledWith(PROJECT_ID);
    expect(result).toEqual([mockPlan]);
  });

  it('findOne delegates to service', async () => {
    mockService.findOne.mockResolvedValue(mockPlan);

    const result = await controller.findOne(PROJECT_ID, 'plan-1');

    expect(mockService.findOne).toHaveBeenCalledWith(PROJECT_ID, 'plan-1');
    expect(result).toEqual(mockPlan);
  });

  it('update delegates to service', async () => {
    const updated = { ...mockPlan, name: 'Renamed' };
    mockService.update.mockResolvedValue(updated);

    const result = await controller.update(PROJECT_ID, 'plan-1', { name: 'Renamed' });

    expect(mockService.update).toHaveBeenCalledWith(PROJECT_ID, 'plan-1', { name: 'Renamed' });
    expect(result).toEqual(updated);
  });

  it('remove delegates to service', async () => {
    const deleted = { ...mockPlan, deletedAt: new Date() };
    mockService.softDelete.mockResolvedValue(deleted);

    const result = await controller.remove(PROJECT_ID, 'plan-1');

    expect(mockService.softDelete).toHaveBeenCalledWith(PROJECT_ID, 'plan-1');
    expect(result).toEqual(deleted);
  });
});
