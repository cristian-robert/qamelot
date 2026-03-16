import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TestPlansService } from './test-plans.service';

const PROJECT_ID = 'proj-1';

const mockPlan = {
  id: 'plan-1',
  name: 'Sprint 1 Plan',
  description: null,
  projectId: PROJECT_ID,
  status: 'DRAFT',
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockPlanWithCount = {
  ...mockPlan,
  _count: { testRuns: 2 },
};

describe('TestPlansService', () => {
  let service: TestPlansService;

  const mockPrisma = {
    testPlan: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    project: {
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TestPlansService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<TestPlansService>(TestPlansService);
  });

  describe('create', () => {
    it('creates a test plan', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, deletedAt: null });
      mockPrisma.testPlan.create.mockResolvedValue(mockPlan);

      const result = await service.create(PROJECT_ID, { name: 'Sprint 1 Plan' });

      expect(mockPrisma.testPlan.create).toHaveBeenCalledWith({
        data: { name: 'Sprint 1 Plan', projectId: PROJECT_ID },
      });
      expect(result).toEqual(mockPlan);
    });

    it('creates a test plan with description', async () => {
      const withDesc = { ...mockPlan, description: 'Plan desc' };
      mockPrisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, deletedAt: null });
      mockPrisma.testPlan.create.mockResolvedValue(withDesc);

      const result = await service.create(PROJECT_ID, {
        name: 'Sprint 1 Plan',
        description: 'Plan desc',
      });

      expect(mockPrisma.testPlan.create).toHaveBeenCalledWith({
        data: { name: 'Sprint 1 Plan', description: 'Plan desc', projectId: PROJECT_ID },
      });
      expect(result).toEqual(withDesc);
    });

    it('throws NotFoundException when project not found', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(null);

      await expect(service.create(PROJECT_ID, { name: 'Plan' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAllByProject', () => {
    it('returns all non-deleted plans with run counts', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, deletedAt: null });
      mockPrisma.testPlan.findMany.mockResolvedValue([mockPlanWithCount]);

      const result = await service.findAllByProject(PROJECT_ID);

      expect(mockPrisma.testPlan.findMany).toHaveBeenCalledWith({
        where: { projectId: PROJECT_ID, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { testRuns: true } } },
      });
      expect(result).toEqual([mockPlanWithCount]);
    });

    it('throws NotFoundException when project not found', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(null);

      await expect(service.findAllByProject(PROJECT_ID)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    it('returns the plan with run count', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, deletedAt: null });
      mockPrisma.testPlan.findFirst.mockResolvedValue(mockPlanWithCount);

      const result = await service.findOne(PROJECT_ID, 'plan-1');

      expect(mockPrisma.testPlan.findFirst).toHaveBeenCalledWith({
        where: { id: 'plan-1', projectId: PROJECT_ID, deletedAt: null },
        include: { _count: { select: { testRuns: true } } },
      });
      expect(result).toEqual(mockPlanWithCount);
    });

    it('throws NotFoundException when plan not found', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, deletedAt: null });
      mockPrisma.testPlan.findFirst.mockResolvedValue(null);

      await expect(service.findOne(PROJECT_ID, 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('updates a plan name', async () => {
      const updated = { ...mockPlan, name: 'Renamed' };
      mockPrisma.testPlan.findFirst.mockResolvedValue(mockPlan);
      mockPrisma.testPlan.update.mockResolvedValue(updated);

      const result = await service.update(PROJECT_ID, 'plan-1', { name: 'Renamed' });

      expect(mockPrisma.testPlan.update).toHaveBeenCalledWith({
        where: { id: 'plan-1' },
        data: { name: 'Renamed' },
      });
      expect(result).toEqual(updated);
    });

    it('updates plan status', async () => {
      const updated = { ...mockPlan, status: 'ACTIVE' };
      mockPrisma.testPlan.findFirst.mockResolvedValue(mockPlan);
      mockPrisma.testPlan.update.mockResolvedValue(updated);

      const result = await service.update(PROJECT_ID, 'plan-1', { status: 'ACTIVE' });

      expect(mockPrisma.testPlan.update).toHaveBeenCalledWith({
        where: { id: 'plan-1' },
        data: { status: 'ACTIVE' },
      });
      expect(result).toEqual(updated);
    });

    it('throws NotFoundException when plan not found', async () => {
      mockPrisma.testPlan.findFirst.mockResolvedValue(null);

      await expect(
        service.update(PROJECT_ID, 'nonexistent', { name: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('softDelete', () => {
    it('sets deletedAt on the plan', async () => {
      const deleted = { ...mockPlan, deletedAt: new Date() };
      mockPrisma.testPlan.findFirst.mockResolvedValue(mockPlan);
      mockPrisma.testPlan.update.mockResolvedValue(deleted);

      const result = await service.softDelete(PROJECT_ID, 'plan-1');

      expect(mockPrisma.testPlan.update).toHaveBeenCalledWith({
        where: { id: 'plan-1' },
        data: { deletedAt: expect.any(Date) },
      });
      expect(result.deletedAt).not.toBeNull();
    });

    it('throws NotFoundException when plan not found', async () => {
      mockPrisma.testPlan.findFirst.mockResolvedValue(null);

      await expect(service.softDelete(PROJECT_ID, 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
