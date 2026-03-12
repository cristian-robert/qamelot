import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsService } from './projects.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('ProjectsService', () => {
  let service: ProjectsService;

  const mockPrisma = {
    project: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      updateMany: jest.fn(),
    },
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
      providers: [
        ProjectsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
  });

  describe('create', () => {
    it('creates a project and returns it', async () => {
      mockPrisma.project.create.mockResolvedValue(testProject);

      const result = await service.create({ name: 'Test Project', description: 'A test project' });

      expect(mockPrisma.project.create).toHaveBeenCalledWith({
        data: { name: 'Test Project', description: 'A test project' },
      });
      expect(result).toEqual(testProject);
    });
  });

  describe('findAll', () => {
    it('returns only active projects (deletedAt is null)', async () => {
      mockPrisma.project.findMany.mockResolvedValue([testProject]);

      const result = await service.findAll();

      expect(mockPrisma.project.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual([testProject]);
    });
  });

  describe('findOne', () => {
    it('returns project when found and not deleted', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(testProject);

      const result = await service.findOne('proj-1');

      expect(mockPrisma.project.findFirst).toHaveBeenCalledWith({
        where: { id: 'proj-1', deletedAt: null },
      });
      expect(result).toEqual(testProject);
    });

    it('throws NotFoundException when project not found', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('atomically updates and returns the project', async () => {
      const updated = { ...testProject, name: 'Updated Name' };
      mockPrisma.project.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.project.findUnique.mockResolvedValue(updated);

      const result = await service.update('proj-1', { name: 'Updated Name' });

      expect(mockPrisma.project.updateMany).toHaveBeenCalledWith({
        where: { id: 'proj-1', deletedAt: null },
        data: { name: 'Updated Name' },
      });
      expect(result).toEqual(updated);
    });

    it('throws NotFoundException when project does not exist', async () => {
      mockPrisma.project.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.update('nonexistent', { name: 'X' })).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when project is soft-deleted', async () => {
      mockPrisma.project.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.update('proj-1', { name: 'X' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('softDelete', () => {
    it('atomically sets deletedAt on the project', async () => {
      const deleted = { ...testProject, deletedAt: new Date() };
      mockPrisma.project.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.project.findUnique.mockResolvedValue(deleted);

      const result = await service.softDelete('proj-1');

      expect(mockPrisma.project.updateMany).toHaveBeenCalledWith({
        where: { id: 'proj-1', deletedAt: null },
        data: { deletedAt: expect.any(Date) },
      });
      expect(result!.deletedAt).not.toBeNull();
    });

    it('throws NotFoundException when project does not exist', async () => {
      mockPrisma.project.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.softDelete('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when project is already soft-deleted', async () => {
      mockPrisma.project.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.softDelete('proj-1')).rejects.toThrow(NotFoundException);
    });
  });
});
