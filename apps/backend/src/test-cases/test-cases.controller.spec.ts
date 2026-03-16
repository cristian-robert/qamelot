import { Test, TestingModule } from '@nestjs/testing';
import { TestCasesController } from './test-cases.controller';
import { TestCasesService } from './test-cases.service';

const PROJECT_ID = 'proj-1';
const SUITE_ID = 'suite-1';

const mockTestCase = {
  id: 'case-1',
  title: 'Verify login',
  preconditions: null,
  templateType: 'TEXT',
  priority: 'MEDIUM',
  type: 'FUNCTIONAL',
  estimate: null,
  references: null,
  position: 0,
  suiteId: SUITE_ID,
  projectId: PROJECT_ID,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  steps: [],
};

const mockStep = {
  id: 'step-1',
  caseId: 'case-1',
  stepNumber: 1,
  description: 'Click login',
  expectedResult: 'Form appears',
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
    copyToSuite: jest.fn(),
    moveToSuite: jest.fn(),
    createStep: jest.fn(),
    findAllSteps: jest.fn(),
    updateStep: jest.fn(),
    deleteStep: jest.fn(),
    reorderSteps: jest.fn(),
    exportCasesCsv: jest.fn(),
    importCasesCsv: jest.fn(),
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

  it('findAllBySuite delegates to service with parsed query params', async () => {
    const paginated = { data: [mockTestCase], total: 1, page: 1, pageSize: 50, totalPages: 1 };
    mockService.findAllBySuite.mockResolvedValue(paginated);

    const result = await controller.findAllBySuite(
      PROJECT_ID,
      SUITE_ID,
      '1',
      '50',
      'HIGH',
      'FUNCTIONAL',
      'login',
    );

    expect(mockService.findAllBySuite).toHaveBeenCalledWith(PROJECT_ID, SUITE_ID, {
      page: 1,
      pageSize: 50,
      priority: 'HIGH',
      type: 'FUNCTIONAL',
      search: 'login',
    });
    expect(result).toEqual(paginated);
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

  it('copy delegates to service', async () => {
    const copied = { ...mockTestCase, id: 'case-2', suiteId: 'suite-2' };
    mockService.copyToSuite.mockResolvedValue(copied);

    const result = await controller.copy(PROJECT_ID, 'case-1', { targetSuiteId: 'suite-2' });

    expect(mockService.copyToSuite).toHaveBeenCalledWith(PROJECT_ID, 'case-1', 'suite-2');
    expect(result).toEqual(copied);
  });

  it('move delegates to service', async () => {
    const moved = { ...mockTestCase, suiteId: 'suite-2' };
    mockService.moveToSuite.mockResolvedValue(moved);

    const result = await controller.move(PROJECT_ID, 'case-1', { targetSuiteId: 'suite-2' });

    expect(mockService.moveToSuite).toHaveBeenCalledWith(PROJECT_ID, 'case-1', 'suite-2');
    expect(result).toEqual(moved);
  });

  it('createStep delegates to service', async () => {
    mockService.createStep.mockResolvedValue(mockStep);

    const result = await controller.createStep(PROJECT_ID, 'case-1', {
      description: 'Click login',
      expectedResult: 'Form appears',
    });

    expect(mockService.createStep).toHaveBeenCalledWith(PROJECT_ID, 'case-1', {
      description: 'Click login',
      expectedResult: 'Form appears',
    });
    expect(result).toEqual(mockStep);
  });

  it('findAllSteps delegates to service', async () => {
    mockService.findAllSteps.mockResolvedValue([mockStep]);

    const result = await controller.findAllSteps(PROJECT_ID, 'case-1');

    expect(mockService.findAllSteps).toHaveBeenCalledWith(PROJECT_ID, 'case-1');
    expect(result).toEqual([mockStep]);
  });

  it('updateStep delegates to service', async () => {
    const updated = { ...mockStep, description: 'Updated' };
    mockService.updateStep.mockResolvedValue(updated);

    const result = await controller.updateStep(PROJECT_ID, 'case-1', 'step-1', {
      description: 'Updated',
    });

    expect(mockService.updateStep).toHaveBeenCalledWith(PROJECT_ID, 'case-1', 'step-1', {
      description: 'Updated',
    });
    expect(result).toEqual(updated);
  });

  it('deleteStep delegates to service', async () => {
    mockService.deleteStep.mockResolvedValue({ deleted: true });

    const result = await controller.deleteStep(PROJECT_ID, 'case-1', 'step-1');

    expect(mockService.deleteStep).toHaveBeenCalledWith(PROJECT_ID, 'case-1', 'step-1');
    expect(result).toEqual({ deleted: true });
  });

  it('reorderSteps delegates to service', async () => {
    const reordered = [mockStep];
    mockService.reorderSteps.mockResolvedValue(reordered);

    const result = await controller.reorderSteps(PROJECT_ID, 'case-1', {
      stepIds: ['step-2', 'step-1'],
    });

    expect(mockService.reorderSteps).toHaveBeenCalledWith(PROJECT_ID, 'case-1', [
      'step-2',
      'step-1',
    ]);
    expect(result).toEqual(reordered);
  });

  it('exportCases sends CSV response', async () => {
    const csvContent = 'Title,Suite\nTest,Auth\n';
    mockService.exportCasesCsv.mockResolvedValue(csvContent);

    const mockRes = {
      setHeader: jest.fn(),
      send: jest.fn(),
    };

    await controller.exportCases(PROJECT_ID, mockRes as never);

    expect(mockService.exportCasesCsv).toHaveBeenCalledWith(PROJECT_ID);
    expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
    expect(mockRes.setHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      `attachment; filename="test-cases-${PROJECT_ID}.csv"`,
    );
    expect(mockRes.send).toHaveBeenCalledWith(csvContent);
  });

  it('importCases delegates to service with file buffer', async () => {
    const importResult = { imported: 3, errors: [] };
    mockService.importCasesCsv.mockResolvedValue(importResult);

    const mockFile = {
      buffer: Buffer.from('Title,Suite\nTest,Auth\n'),
      originalname: 'test.csv',
    } as Express.Multer.File;

    const result = await controller.importCases(PROJECT_ID, mockFile);

    expect(mockService.importCasesCsv).toHaveBeenCalledWith(PROJECT_ID, mockFile.buffer);
    expect(result).toEqual(importResult);
  });
});
