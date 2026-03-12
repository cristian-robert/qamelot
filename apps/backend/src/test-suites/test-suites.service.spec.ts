import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
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

const childSuite = {
  ...mockSuite,
  id: 'suite-2',
  name: 'OAuth Tests',
  parentId: 'suite-1',
};

describe('TestSuitesService', () => {
  let service: TestSuitesService;

  const mockPrisma = {
    testSuite: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    project: {
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TestSuitesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<TestSuitesService>(TestSuitesService);
  });

  describe('create', () => {
    it('creates a root suite', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, deletedAt: null });
      mockPrisma.testSuite.create.mockResolvedValue(mockSuite);

      const result = await service.create(PROJECT_ID, { name: 'Login Tests' });

      expect(mockPrisma.project.findFirst).toHaveBeenCalledWith({
        where: { id: PROJECT_ID, deletedAt: null },
      });
      expect(mockPrisma.testSuite.create).toHaveBeenCalledWith({
        data: { name: 'Login Tests', projectId: PROJECT_ID },
      });
      expect(result).toEqual(mockSuite);
    });

    it('creates a child suite with parentId', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, deletedAt: null });
      mockPrisma.testSuite.findFirst.mockResolvedValue(mockSuite);
      mockPrisma.testSuite.create.mockResolvedValue(childSuite);

      const result = await service.create(PROJECT_ID, {
        name: 'OAuth Tests',
        parentId: 'suite-1',
      });

      expect(mockPrisma.testSuite.findFirst).toHaveBeenCalledWith({
        where: { id: 'suite-1', projectId: PROJECT_ID, deletedAt: null },
      });
      expect(mockPrisma.testSuite.create).toHaveBeenCalledWith({
        data: { name: 'OAuth Tests', projectId: PROJECT_ID, parentId: 'suite-1' },
      });
      expect(result).toEqual(childSuite);
    });

    it('throws NotFoundException when project does not exist', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(null);

      await expect(service.create(PROJECT_ID, { name: 'Test' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFoundException when parent suite does not exist', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, deletedAt: null });
      mockPrisma.testSuite.findFirst.mockResolvedValue(null);

      await expect(
        service.create(PROJECT_ID, { name: 'Test', parentId: 'nonexistent' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAllByProject', () => {
    it('returns all non-deleted suites for a project', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, deletedAt: null });
      mockPrisma.testSuite.findMany.mockResolvedValue([mockSuite, childSuite]);

      const result = await service.findAllByProject(PROJECT_ID);

      expect(mockPrisma.testSuite.findMany).toHaveBeenCalledWith({
        where: { projectId: PROJECT_ID, deletedAt: null },
        orderBy: { name: 'asc' },
      });
      expect(result).toEqual([mockSuite, childSuite]);
    });

    it('throws NotFoundException when project does not exist', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(null);

      await expect(service.findAllByProject(PROJECT_ID)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates a suite name', async () => {
      const updated = { ...mockSuite, name: 'Renamed' };
      mockPrisma.testSuite.findFirst.mockResolvedValue(mockSuite);
      mockPrisma.testSuite.update.mockResolvedValue(updated);

      const result = await service.update(PROJECT_ID, 'suite-1', { name: 'Renamed' });

      expect(mockPrisma.testSuite.update).toHaveBeenCalledWith({
        where: { id: 'suite-1' },
        data: { name: 'Renamed' },
      });
      expect(result).toEqual(updated);
    });

    it('moves a suite to root (parentId: null)', async () => {
      const moved = { ...childSuite, parentId: null };
      mockPrisma.testSuite.findFirst.mockResolvedValueOnce(childSuite);
      mockPrisma.testSuite.update.mockResolvedValue(moved);

      const result = await service.update(PROJECT_ID, 'suite-2', { parentId: null });

      expect(mockPrisma.testSuite.update).toHaveBeenCalledWith({
        where: { id: 'suite-2' },
        data: { parentId: null },
      });
      expect(result).toEqual(moved);
    });

    it('moves a suite to a different parent', async () => {
      const newParent = { ...mockSuite, id: 'suite-3', name: 'New Parent' };
      const moved = { ...childSuite, parentId: 'suite-3' };
      mockPrisma.testSuite.findFirst
        .mockResolvedValueOnce(childSuite)
        .mockResolvedValueOnce(newParent);
      mockPrisma.testSuite.update.mockResolvedValue(moved);

      const result = await service.update(PROJECT_ID, 'suite-2', { parentId: 'suite-3' });

      expect(mockPrisma.testSuite.update).toHaveBeenCalledWith({
        where: { id: 'suite-2' },
        data: { parentId: 'suite-3' },
      });
      expect(result).toEqual(moved);
    });

    it('validates new parent exists when moving to non-null parent', async () => {
      mockPrisma.testSuite.findFirst
        .mockResolvedValueOnce(mockSuite)
        .mockResolvedValueOnce(null);

      await expect(
        service.update(PROJECT_ID, 'suite-1', { parentId: 'nonexistent' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when suite does not exist', async () => {
      mockPrisma.testSuite.findFirst.mockResolvedValue(null);

      await expect(
        service.update(PROJECT_ID, 'nonexistent', { name: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('softDelete', () => {
    it('soft-deletes a suite and its descendants', async () => {
      mockPrisma.testSuite.findFirst.mockResolvedValue(mockSuite);
      mockPrisma.testSuite.findMany
        .mockResolvedValueOnce([childSuite])  // children of suite-1
        .mockResolvedValueOnce([]);           // children of suite-2 (leaf)
      mockPrisma.testSuite.updateMany.mockResolvedValue({ count: 2 });

      const result = await service.softDelete(PROJECT_ID, 'suite-1');

      expect(mockPrisma.testSuite.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['suite-1', 'suite-2'] } },
        data: { deletedAt: expect.any(Date) },
      });
      expect(result).toEqual({ deleted: 2 });
    });

    it('throws NotFoundException when suite does not exist', async () => {
      mockPrisma.testSuite.findFirst.mockResolvedValue(null);

      await expect(service.softDelete(PROJECT_ID, 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
