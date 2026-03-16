import { Test, TestingModule } from '@nestjs/testing';
import { MilestonesController } from './milestones.controller';
import { MilestonesService } from './milestones.service';

describe('MilestonesController', () => {
  let controller: MilestonesController;

  const mockService = {
    create: jest.fn(),
    findAllByProject: jest.fn(),
    findTreeByProject: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  };

  const testMilestone = {
    id: 'ms-1',
    name: 'Sprint 1',
    description: 'First sprint',
    projectId: 'proj-1',
    parentId: null,
    startDate: new Date('2026-04-01'),
    dueDate: new Date('2026-04-30'),
    status: 'OPEN',
    deletedAt: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MilestonesController],
      providers: [{ provide: MilestonesService, useValue: mockService }],
    }).compile();

    controller = module.get<MilestonesController>(MilestonesController);
  });

  describe('create', () => {
    it('calls service.create and returns the result', async () => {
      mockService.create.mockResolvedValue(testMilestone);
      const dto = { name: 'Sprint 1', description: 'First sprint' };

      const result = await controller.create('proj-1', dto);

      expect(mockService.create).toHaveBeenCalledWith('proj-1', dto);
      expect(result).toEqual(testMilestone);
    });

    it('passes parentId to service.create for sub-milestones', async () => {
      const subMilestone = { ...testMilestone, id: 'ms-2', parentId: 'ms-1' };
      mockService.create.mockResolvedValue(subMilestone);
      const dto = { name: 'Sub Sprint', parentId: 'ms-1' };

      const result = await controller.create('proj-1', dto);

      expect(mockService.create).toHaveBeenCalledWith('proj-1', dto);
      expect(result.parentId).toBe('ms-1');
    });
  });

  describe('findAll', () => {
    it('calls service.findAllByProject without filters', async () => {
      mockService.findAllByProject.mockResolvedValue([testMilestone]);

      const result = await controller.findAll('proj-1');

      expect(mockService.findAllByProject).toHaveBeenCalledWith('proj-1', {
        status: undefined,
      });
      expect(result).toEqual([testMilestone]);
    });

    it('passes status filter to service', async () => {
      mockService.findAllByProject.mockResolvedValue([]);

      await controller.findAll('proj-1', 'CLOSED');

      expect(mockService.findAllByProject).toHaveBeenCalledWith('proj-1', {
        status: 'CLOSED',
      });
    });
  });

  describe('findTree', () => {
    it('calls service.findTreeByProject and returns tree', async () => {
      const treeNode = {
        ...testMilestone,
        children: [],
        progress: { open: 1, closed: 0, total: 1, percent: 0 },
      };
      mockService.findTreeByProject.mockResolvedValue([treeNode]);

      const result = await controller.findTree('proj-1');

      expect(mockService.findTreeByProject).toHaveBeenCalledWith('proj-1');
      expect(result).toEqual([treeNode]);
    });
  });

  describe('findOne', () => {
    it('calls service.findOne with the id', async () => {
      mockService.findOne.mockResolvedValue(testMilestone);

      const result = await controller.findOne('ms-1');

      expect(mockService.findOne).toHaveBeenCalledWith('ms-1');
      expect(result).toEqual(testMilestone);
    });
  });

  describe('update', () => {
    it('calls service.update with id and dto', async () => {
      const updated = { ...testMilestone, name: 'Updated Sprint' };
      mockService.update.mockResolvedValue(updated);

      const result = await controller.update('ms-1', { name: 'Updated Sprint' });

      expect(mockService.update).toHaveBeenCalledWith('ms-1', { name: 'Updated Sprint' });
      expect(result).toEqual(updated);
    });
  });

  describe('remove', () => {
    it('calls service.softDelete with the id', async () => {
      const deleted = { ...testMilestone, deletedAt: new Date() };
      mockService.softDelete.mockResolvedValue(deleted);

      const result = await controller.remove('ms-1');

      expect(mockService.softDelete).toHaveBeenCalledWith('ms-1');
      expect(result).toEqual(deleted);
    });
  });
});
