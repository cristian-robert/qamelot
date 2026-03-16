import { Test, TestingModule } from '@nestjs/testing';
import { TestCasesController } from './test-cases.controller';
import { TestCasesService } from './test-cases.service';

const PROJECT_ID = 'proj-1';
const SUITE_ID = 'suite-1';

const mockTestCase = {
  id: 'case-1',
  title: 'Verify login',
  preconditions: null,
  steps: [],
  priority: 'MEDIUM',
  type: 'FUNCTIONAL',
  automationFlag: false,
  suiteId: SUITE_ID,
  projectId: PROJECT_ID,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('TestCasesController', () => {
  let controller: TestCasesController;

  const mockService = {
    create: jest.fn(),
    findAllBySuite: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TestCasesController],
      providers: [{ provide: TestCasesService, useValue: mockService }],
    }).compile();
    controller = module.get<TestCasesController>(TestCasesController);
  });

  it('create delegates to service', async () => {
    mockService.create.mockResolvedValue(mockTestCase);

    const result = await controller.create(PROJECT_ID, SUITE_ID, { title: 'Verify login' });

    expect(mockService.create).toHaveBeenCalledWith(PROJECT_ID, SUITE_ID, { title: 'Verify login' });
    expect(result).toEqual(mockTestCase);
  });

  it('findAllBySuite delegates to service', async () => {
    mockService.findAllBySuite.mockResolvedValue([mockTestCase]);

    const result = await controller.findAllBySuite(PROJECT_ID, SUITE_ID);

    expect(mockService.findAllBySuite).toHaveBeenCalledWith(PROJECT_ID, SUITE_ID);
    expect(result).toEqual([mockTestCase]);
  });

  it('findOne delegates to service', async () => {
    mockService.findOne.mockResolvedValue(mockTestCase);

    const result = await controller.findOne(PROJECT_ID, 'case-1');

    expect(mockService.findOne).toHaveBeenCalledWith(PROJECT_ID, 'case-1');
    expect(result).toEqual(mockTestCase);
  });

  it('update delegates to service', async () => {
    const updated = { ...mockTestCase, title: 'Updated' };
    mockService.update.mockResolvedValue(updated);

    const result = await controller.update(PROJECT_ID, 'case-1', { title: 'Updated' });

    expect(mockService.update).toHaveBeenCalledWith(PROJECT_ID, 'case-1', { title: 'Updated' });
    expect(result).toEqual(updated);
  });

  it('remove delegates to service', async () => {
    const deleted = { ...mockTestCase, deletedAt: new Date() };
    mockService.softDelete.mockResolvedValue(deleted);

    const result = await controller.remove(PROJECT_ID, 'case-1');

    expect(mockService.softDelete).toHaveBeenCalledWith(PROJECT_ID, 'case-1');
    expect(result).toEqual(deleted);
  });
});
