import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

describe('ProjectsController', () => {
  let controller: ProjectsController;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  };

  const testProject = {
    id: 'proj-1',
    name: 'Test Project',
    description: 'A test project',
    deletedAt: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectsController],
      providers: [{ provide: ProjectsService, useValue: mockService }],
    }).compile();

    controller = module.get<ProjectsController>(ProjectsController);
  });

  describe('create', () => {
    it('calls service.create and returns the result', async () => {
      mockService.create.mockResolvedValue(testProject);

      const result = await controller.create({ name: 'Test Project', description: 'A test project' });

      expect(mockService.create).toHaveBeenCalledWith({ name: 'Test Project', description: 'A test project' });
      expect(result).toEqual(testProject);
    });
  });

  describe('findAll', () => {
    it('calls service.findAll and returns the result', async () => {
      mockService.findAll.mockResolvedValue([testProject]);

      const result = await controller.findAll();

      expect(mockService.findAll).toHaveBeenCalled();
      expect(result).toEqual([testProject]);
    });
  });

  describe('findOne', () => {
    it('calls service.findOne with the id', async () => {
      mockService.findOne.mockResolvedValue(testProject);

      const result = await controller.findOne('proj-1');

      expect(mockService.findOne).toHaveBeenCalledWith('proj-1');
      expect(result).toEqual(testProject);
    });
  });

  describe('update', () => {
    it('calls service.update with id and dto', async () => {
      const updated = { ...testProject, name: 'Updated' };
      mockService.update.mockResolvedValue(updated);

      const result = await controller.update('proj-1', { name: 'Updated' });

      expect(mockService.update).toHaveBeenCalledWith('proj-1', { name: 'Updated' });
      expect(result).toEqual(updated);
    });
  });

  describe('remove', () => {
    it('calls service.softDelete with the id', async () => {
      const deleted = { ...testProject, deletedAt: new Date() };
      mockService.softDelete.mockResolvedValue(deleted);

      const result = await controller.remove('proj-1');

      expect(mockService.softDelete).toHaveBeenCalledWith('proj-1');
      expect(result).toEqual(deleted);
    });
  });
});
