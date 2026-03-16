import { Test, TestingModule } from '@nestjs/testing';
import { DefectsController } from './defects.controller';
import { DefectsService } from './defects.service';

describe('DefectsController', () => {
  let controller: DefectsController;

  const mockService = {
    create: jest.fn(),
    findAllByProject: jest.fn(),
    findOne: jest.fn(),
    findByTestResultId: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  };

  const testDefect = {
    id: 'def-1',
    reference: 'PROJ-123',
    description: 'Login fails with special chars',
    projectId: 'proj-1',
    testResultId: null,
    deletedAt: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DefectsController],
      providers: [{ provide: DefectsService, useValue: mockService }],
    }).compile();

    controller = module.get<DefectsController>(DefectsController);
  });

  describe('create', () => {
    it('calls service.create and returns the result', async () => {
      mockService.create.mockResolvedValue(testDefect);
      const dto = { reference: 'PROJ-123', description: 'Login fails with special chars' };

      const result = await controller.create('proj-1', dto);

      expect(mockService.create).toHaveBeenCalledWith('proj-1', dto);
      expect(result).toEqual(testDefect);
    });

    it('passes testResultId to service.create', async () => {
      const linkedDefect = { ...testDefect, testResultId: 'result-1' };
      mockService.create.mockResolvedValue(linkedDefect);
      const dto = { reference: 'PROJ-123', description: 'Failure', testResultId: 'result-1' };

      const result = await controller.create('proj-1', dto);

      expect(mockService.create).toHaveBeenCalledWith('proj-1', dto);
      expect(result).toEqual(linkedDefect);
    });
  });

  describe('findAll', () => {
    it('calls service.findAllByProject without filters', async () => {
      mockService.findAllByProject.mockResolvedValue([testDefect]);

      const result = await controller.findAll('proj-1');

      expect(mockService.findAllByProject).toHaveBeenCalledWith('proj-1', {
        search: undefined,
      });
      expect(result).toEqual([testDefect]);
    });

    it('passes search filter to service', async () => {
      mockService.findAllByProject.mockResolvedValue([]);

      await controller.findAll('proj-1', 'login');

      expect(mockService.findAllByProject).toHaveBeenCalledWith('proj-1', {
        search: 'login',
      });
    });
  });

  describe('findByTestResult', () => {
    it('calls service.findByTestResultId and returns defects', async () => {
      const linkedDefect = { ...testDefect, testResultId: 'result-1' };
      mockService.findByTestResultId.mockResolvedValue([linkedDefect]);

      const result = await controller.findByTestResult('result-1');

      expect(mockService.findByTestResultId).toHaveBeenCalledWith('result-1');
      expect(result).toEqual([linkedDefect]);
    });

    it('returns empty array when no defects linked', async () => {
      mockService.findByTestResultId.mockResolvedValue([]);

      const result = await controller.findByTestResult('result-no-defects');

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('calls service.findOne with the id', async () => {
      mockService.findOne.mockResolvedValue(testDefect);

      const result = await controller.findOne('def-1');

      expect(mockService.findOne).toHaveBeenCalledWith('def-1');
      expect(result).toEqual(testDefect);
    });
  });

  describe('update', () => {
    it('calls service.update with id and dto', async () => {
      const updated = { ...testDefect, reference: 'PROJ-456' };
      mockService.update.mockResolvedValue(updated);

      const result = await controller.update('def-1', { reference: 'PROJ-456' });

      expect(mockService.update).toHaveBeenCalledWith('def-1', { reference: 'PROJ-456' });
      expect(result).toEqual(updated);
    });
  });

  describe('remove', () => {
    it('calls service.softDelete with the id', async () => {
      const deleted = { ...testDefect, deletedAt: new Date() };
      mockService.softDelete.mockResolvedValue(deleted);

      const result = await controller.remove('def-1');

      expect(mockService.softDelete).toHaveBeenCalledWith('def-1');
      expect(result).toEqual(deleted);
    });
  });
});
