import { Test, TestingModule } from '@nestjs/testing';
import { TestSuitesController } from './test-suites.controller';
import { TestSuitesService } from './test-suites.service';

const PROJECT_ID = 'proj-1';

const mockSuite = {
  id: 'suite-1',
  name: 'Login Tests',
  description: null,
  projectId: PROJECT_ID,
  parentId: null,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('TestSuitesController', () => {
  let controller: TestSuitesController;

  const mockService = {
    create: jest.fn(),
    findAllByProject: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TestSuitesController],
      providers: [{ provide: TestSuitesService, useValue: mockService }],
    }).compile();
    controller = module.get<TestSuitesController>(TestSuitesController);
  });

  it('create delegates to service', async () => {
    mockService.create.mockResolvedValue(mockSuite);

    const result = await controller.create(PROJECT_ID, { name: 'Login Tests' });

    expect(mockService.create).toHaveBeenCalledWith(PROJECT_ID, { name: 'Login Tests' });
    expect(result).toEqual(mockSuite);
  });

  it('findAll delegates to service', async () => {
    mockService.findAllByProject.mockResolvedValue([mockSuite]);

    const result = await controller.findAll(PROJECT_ID);

    expect(mockService.findAllByProject).toHaveBeenCalledWith(PROJECT_ID);
    expect(result).toEqual([mockSuite]);
  });

  it('update delegates to service', async () => {
    const updated = { ...mockSuite, name: 'Renamed' };
    mockService.update.mockResolvedValue(updated);

    const result = await controller.update(PROJECT_ID, 'suite-1', { name: 'Renamed' });

    expect(mockService.update).toHaveBeenCalledWith(PROJECT_ID, 'suite-1', { name: 'Renamed' });
    expect(result).toEqual(updated);
  });

  it('remove delegates to service', async () => {
    mockService.softDelete.mockResolvedValue({ deleted: 1 });

    const result = await controller.remove(PROJECT_ID, 'suite-1');

    expect(mockService.softDelete).toHaveBeenCalledWith(PROJECT_ID, 'suite-1');
    expect(result).toEqual({ deleted: 1 });
  });
});
