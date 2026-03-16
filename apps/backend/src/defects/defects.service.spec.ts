import { Test, TestingModule } from '@nestjs/testing';
import { DefectsService } from './defects.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('DefectsService', () => {
  let service: DefectsService;

  const mockPrisma = {
    project: {
      findFirst: jest.fn(),
    },
    defect: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  const testDefect = {
    id: 'def-1',
    reference: 'PROJ-123',
    description: 'Login fails with special chars',
    projectId: 'proj-1',
    deletedAt: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DefectsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<DefectsService>(DefectsService);
    mockPrisma.project.findFirst.mockResolvedValue({ id: 'proj-1' });
  });

  describe('create', () => {
    it('creates a defect and returns it', async () => {
      mockPrisma.defect.create.mockResolvedValue(testDefect);

      const result = await service.create('proj-1', {
        reference: 'PROJ-123',
        description: 'Login fails with special chars',
      });

      expect(mockPrisma.project.findFirst).toHaveBeenCalledWith({
        where: { id: 'proj-1', deletedAt: null },
      });
      expect(mockPrisma.defect.create).toHaveBeenCalled();
      expect(result).toEqual(testDefect);
    });

    it('throws NotFoundException when project not found', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(null);

      await expect(
        service.create('nonexistent', { reference: 'PROJ-123' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAllByProject', () => {
    it('returns only active defects for the project', async () => {
      mockPrisma.defect.findMany.mockResolvedValue([testDefect]);

      const result = await service.findAllByProject('proj-1');

      expect(mockPrisma.defect.findMany).toHaveBeenCalledWith({
        where: { projectId: 'proj-1', deletedAt: null },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual([testDefect]);
    });

    it('throws NotFoundException when project not found', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(null);

      await expect(service.findAllByProject('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findOne', () => {
    it('returns defect when found and not deleted', async () => {
      mockPrisma.defect.findFirst.mockResolvedValue(testDefect);

      const result = await service.findOne('def-1');

      expect(mockPrisma.defect.findFirst).toHaveBeenCalledWith({
        where: { id: 'def-1', deletedAt: null },
      });
      expect(result).toEqual(testDefect);
    });

    it('throws NotFoundException when defect not found', async () => {
      mockPrisma.defect.findFirst.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('updates and returns the defect', async () => {
      const updated = { ...testDefect, reference: 'PROJ-456' };
      mockPrisma.defect.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.defect.findUnique.mockResolvedValue(updated);

      const result = await service.update('def-1', { reference: 'PROJ-456' });

      expect(mockPrisma.defect.updateMany).toHaveBeenCalledWith({
        where: { id: 'def-1', deletedAt: null },
        data: { reference: 'PROJ-456' },
      });
      expect(result).toEqual(updated);
    });

    it('throws NotFoundException when defect does not exist', async () => {
      mockPrisma.defect.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.update('nonexistent', { reference: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('softDelete', () => {
    it('sets deletedAt on the defect', async () => {
      const deleted = { ...testDefect, deletedAt: new Date() };
      mockPrisma.defect.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.defect.findUnique.mockResolvedValue(deleted);

      const result = await service.softDelete('def-1');

      expect(mockPrisma.defect.updateMany).toHaveBeenCalledWith({
        where: { id: 'def-1', deletedAt: null },
        data: { deletedAt: expect.any(Date) },
      });
      expect(result!.deletedAt).not.toBeNull();
    });

    it('throws NotFoundException when defect does not exist', async () => {
      mockPrisma.defect.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.softDelete('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
