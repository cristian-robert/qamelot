import { Test, TestingModule } from '@nestjs/testing';
import { MilestonesService } from './milestones.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

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

    it('creates a sub-milestone with parentId', async () => {
      const parentMilestone = { ...testMilestone, id: 'ms-parent' };
      const childMilestone = { ...testMilestone, id: 'ms-child', parentId: 'ms-parent' };
      mockPrisma.milestone.findFirst.mockResolvedValue(parentMilestone);
      mockPrisma.milestone.create.mockResolvedValue(childMilestone);

      const result = await service.create('proj-1', {
        name: 'Sub Sprint',
        parentId: 'ms-parent',
      });

      expect(mockPrisma.milestone.findFirst).toHaveBeenCalledWith({
        where: { id: 'ms-parent', projectId: 'proj-1', deletedAt: null },
      });
      expect(mockPrisma.milestone.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ parentId: 'ms-parent' }),
      });
      expect(result.parentId).toBe('ms-parent');
    });

    it('throws BadRequestException when parent not found', async () => {
      mockPrisma.milestone.findFirst.mockResolvedValue(null);

      await expect(
        service.create('proj-1', { name: 'Sub Sprint', parentId: 'nonexistent' }),
      ).rejects.toThrow(BadRequestException);
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

    it('filters by status OPEN when provided', async () => {
      mockPrisma.milestone.findMany.mockResolvedValue([testMilestone]);

      await service.findAllByProject('proj-1', { status: 'OPEN' });

      expect(mockPrisma.milestone.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { projectId: 'proj-1', deletedAt: null, status: 'OPEN' },
        }),
      );
    });

    it('filters by status CLOSED when provided', async () => {
      mockPrisma.milestone.findMany.mockResolvedValue([]);

      await service.findAllByProject('proj-1', { status: 'CLOSED' });

      expect(mockPrisma.milestone.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { projectId: 'proj-1', deletedAt: null, status: 'CLOSED' },
        }),
      );
    });

    it('does not add status filter when value is empty string', async () => {
      mockPrisma.milestone.findMany.mockResolvedValue([]);

      await service.findAllByProject('proj-1', { status: '' });

      expect(mockPrisma.milestone.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { projectId: 'proj-1', deletedAt: null },
        }),
      );
    });

    it('throws NotFoundException when project not found', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(null);

      await expect(service.findAllByProject('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findTreeByProject', () => {
    it('returns a tree structure with progress aggregation', async () => {
      const parent = {
        ...testMilestone,
        id: 'ms-parent',
        name: 'Release 1',
        parentId: null,
        status: 'OPEN',
      };
      const child1 = {
        ...testMilestone,
        id: 'ms-child1',
        name: 'Sprint 1',
        parentId: 'ms-parent',
        status: 'CLOSED',
      };
      const child2 = {
        ...testMilestone,
        id: 'ms-child2',
        name: 'Sprint 2',
        parentId: 'ms-parent',
        status: 'OPEN',
      };

      mockPrisma.milestone.findMany.mockResolvedValue([parent, child1, child2]);

      const result = await service.findTreeByProject('proj-1');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('ms-parent');
      expect(result[0].children).toHaveLength(2);
      // Progress: parent is OPEN (1), child1 CLOSED (1), child2 OPEN (1)
      // total = 3, closed = 1, open = 2, percent = 33
      expect(result[0].progress).toEqual({
        open: 2,
        closed: 1,
        total: 3,
        percent: 33,
      });
    });

    it('returns empty array when no milestones', async () => {
      mockPrisma.milestone.findMany.mockResolvedValue([]);
      const result = await service.findTreeByProject('proj-1');
      expect(result).toEqual([]);
    });

    it('throws NotFoundException when project not found', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(null);

      await expect(service.findTreeByProject('nonexistent')).rejects.toThrow(
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

  describe('buildTree', () => {
    const baseMilestone = {
      id: 'ms-1',
      name: 'Root',
      description: null,
      projectId: 'proj-1',
      parentId: null,
      startDate: null,
      dueDate: null,
      status: 'OPEN' as const,
      deletedAt: null,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    };

    it('builds a flat list into root nodes', () => {
      const milestones = [
        { ...baseMilestone, id: 'a', name: 'Alpha' },
        { ...baseMilestone, id: 'b', name: 'Beta' },
      ];

      const result = service.buildTree(milestones);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Alpha');
      expect(result[1].name).toBe('Beta');
    });

    it('nests children under their parent', () => {
      const milestones = [
        { ...baseMilestone, id: 'parent', name: 'Parent' },
        { ...baseMilestone, id: 'child', name: 'Child', parentId: 'parent' },
      ];

      const result = service.buildTree(milestones);

      expect(result).toHaveLength(1);
      expect(result[0].children).toHaveLength(1);
      expect(result[0].children[0].name).toBe('Child');
    });

    it('computes progress for all-closed tree', () => {
      const milestones = [
        { ...baseMilestone, id: 'p', name: 'Parent', status: 'CLOSED' as const },
        { ...baseMilestone, id: 'c', name: 'Child', parentId: 'p', status: 'CLOSED' as const },
      ];

      const result = service.buildTree(milestones);

      expect(result[0].progress.percent).toBe(100);
      expect(result[0].progress.closed).toBe(2);
      expect(result[0].progress.open).toBe(0);
    });

    it('computes progress for mixed-status tree', () => {
      const milestones = [
        { ...baseMilestone, id: 'p', name: 'Parent', status: 'OPEN' as const },
        { ...baseMilestone, id: 'c1', name: 'Child1', parentId: 'p', status: 'CLOSED' as const },
        { ...baseMilestone, id: 'c2', name: 'Child2', parentId: 'p', status: 'OPEN' as const },
      ];

      const result = service.buildTree(milestones);

      // 3 total, 1 closed, percent = 33
      expect(result[0].progress).toEqual({
        open: 2,
        closed: 1,
        total: 3,
        percent: 33,
      });
    });

    it('treats orphan nodes as roots', () => {
      const milestones = [
        { ...baseMilestone, id: 'orphan', name: 'Orphan', parentId: 'nonexistent' },
      ];

      const result = service.buildTree(milestones);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('orphan');
    });
  });
});
