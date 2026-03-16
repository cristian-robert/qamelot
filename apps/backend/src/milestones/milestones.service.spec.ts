import { Test, TestingModule } from '@nestjs/testing';
import { MilestonesService } from './milestones.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('MilestonesService', () => {
  let service: MilestonesService;

  const mockPrisma = {
    project: {
      findFirst: jest.fn(),
    },
    milestone: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  const testMilestone = {
    id: 'ms-1',
    name: 'Sprint 1',
    description: 'First sprint',
    projectId: 'proj-1',
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
      providers: [
        MilestonesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<MilestonesService>(MilestonesService);
    mockPrisma.project.findFirst.mockResolvedValue({ id: 'proj-1' });
  });

  describe('create', () => {
    it('creates a milestone and returns it', async () => {
      mockPrisma.milestone.create.mockResolvedValue(testMilestone);

      const result = await service.create('proj-1', {
        name: 'Sprint 1',
        description: 'First sprint',
        startDate: '2026-04-01T00:00:00.000Z',
        dueDate: '2026-04-30T00:00:00.000Z',
      });

      expect(mockPrisma.project.findFirst).toHaveBeenCalledWith({
        where: { id: 'proj-1', deletedAt: null },
      });
      expect(mockPrisma.milestone.create).toHaveBeenCalled();
      expect(result).toEqual(testMilestone);
    });

    it('throws NotFoundException when project not found', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(null);

      await expect(
        service.create('nonexistent', { name: 'Sprint 1' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAllByProject', () => {
    it('returns only active milestones for the project', async () => {
      mockPrisma.milestone.findMany.mockResolvedValue([testMilestone]);

      const result = await service.findAllByProject('proj-1');

      expect(mockPrisma.milestone.findMany).toHaveBeenCalledWith({
        where: { projectId: 'proj-1', deletedAt: null },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual([testMilestone]);
    });

    it('throws NotFoundException when project not found', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(null);

      await expect(service.findAllByProject('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findOne', () => {
    it('returns milestone when found and not deleted', async () => {
      mockPrisma.milestone.findFirst.mockResolvedValue(testMilestone);

      const result = await service.findOne('ms-1');

      expect(mockPrisma.milestone.findFirst).toHaveBeenCalledWith({
        where: { id: 'ms-1', deletedAt: null },
      });
      expect(result).toEqual(testMilestone);
    });

    it('throws NotFoundException when milestone not found', async () => {
      mockPrisma.milestone.findFirst.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('updates and returns the milestone', async () => {
      const updated = { ...testMilestone, name: 'Sprint 1 - Updated' };
      mockPrisma.milestone.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.milestone.findUnique.mockResolvedValue(updated);

      const result = await service.update('ms-1', { name: 'Sprint 1 - Updated' });

      expect(mockPrisma.milestone.updateMany).toHaveBeenCalledWith({
        where: { id: 'ms-1', deletedAt: null },
        data: { name: 'Sprint 1 - Updated' },
      });
      expect(result).toEqual(updated);
    });

    it('updates status to CLOSED', async () => {
      const closed = { ...testMilestone, status: 'CLOSED' };
      mockPrisma.milestone.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.milestone.findUnique.mockResolvedValue(closed);

      const result = await service.update('ms-1', { status: 'CLOSED' });

      expect(mockPrisma.milestone.updateMany).toHaveBeenCalledWith({
        where: { id: 'ms-1', deletedAt: null },
        data: { status: 'CLOSED' },
      });
      expect(result).toEqual(closed);
    });

    it('throws NotFoundException when milestone does not exist', async () => {
      mockPrisma.milestone.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.update('nonexistent', { name: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('softDelete', () => {
    it('sets deletedAt on the milestone', async () => {
      const deleted = { ...testMilestone, deletedAt: new Date() };
      mockPrisma.milestone.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.milestone.findUnique.mockResolvedValue(deleted);

      const result = await service.softDelete('ms-1');

      expect(mockPrisma.milestone.updateMany).toHaveBeenCalledWith({
        where: { id: 'ms-1', deletedAt: null },
        data: { deletedAt: expect.any(Date) },
      });
      expect(result!.deletedAt).not.toBeNull();
    });

    it('throws NotFoundException when milestone does not exist', async () => {
      mockPrisma.milestone.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.softDelete('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
