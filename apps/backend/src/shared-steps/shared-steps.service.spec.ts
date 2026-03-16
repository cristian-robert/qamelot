import { Test, TestingModule } from '@nestjs/testing';
import { SharedStepsService } from './shared-steps.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

const PROJECT_ID = 'proj-1';
const SHARED_STEP_ID = 'ss-1';

const mockSharedStep = {
  id: SHARED_STEP_ID,
  title: 'Login flow',
  projectId: PROJECT_ID,
  deletedAt: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  items: [
    {
      id: 'ssi-1',
      sharedStepId: SHARED_STEP_ID,
      stepNumber: 1,
      description: 'Navigate to login page',
      expectedResult: 'Login page is displayed',
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    },
    {
      id: 'ssi-2',
      sharedStepId: SHARED_STEP_ID,
      stepNumber: 2,
      description: 'Enter credentials',
      expectedResult: 'Fields accept input',
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    },
  ],
};

describe('SharedStepsService', () => {
  let service: SharedStepsService;

  const mockTx = {
    sharedStep: {
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    sharedStepItem: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
  };

  const mockPrisma = {
    project: {
      findFirst: jest.fn(),
    },
    sharedStep: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    sharedStepItem: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    $transaction: jest.fn((cb: (tx: unknown) => Promise<unknown>) => cb(mockTx)),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SharedStepsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<SharedStepsService>(SharedStepsService);
    mockPrisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, deletedAt: null });
  });

  describe('create', () => {
    it('creates a shared step with items and returns it', async () => {
      mockPrisma.sharedStep.create.mockResolvedValue(mockSharedStep);

      const result = await service.create(PROJECT_ID, {
        title: 'Login flow',
        items: [
          { description: 'Navigate to login page', expectedResult: 'Login page is displayed' },
          { description: 'Enter credentials', expectedResult: 'Fields accept input' },
        ],
      });

      expect(mockPrisma.project.findFirst).toHaveBeenCalledWith({
        where: { id: PROJECT_ID, deletedAt: null },
      });
      expect(mockPrisma.sharedStep.create).toHaveBeenCalledWith({
        data: {
          title: 'Login flow',
          projectId: PROJECT_ID,
          items: {
            create: [
              { stepNumber: 1, description: 'Navigate to login page', expectedResult: 'Login page is displayed' },
              { stepNumber: 2, description: 'Enter credentials', expectedResult: 'Fields accept input' },
            ],
          },
        },
        include: { items: { orderBy: { stepNumber: 'asc' } } },
      });
      expect(result).toEqual(mockSharedStep);
    });

    it('throws NotFoundException when project not found', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(null);

      await expect(
        service.create('nonexistent', {
          title: 'Test',
          items: [{ description: 'Step 1', expectedResult: 'Result 1' }],
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAllByProject', () => {
    it('returns all non-deleted shared steps for a project', async () => {
      mockPrisma.sharedStep.findMany.mockResolvedValue([mockSharedStep]);

      const result = await service.findAllByProject(PROJECT_ID);

      expect(mockPrisma.sharedStep.findMany).toHaveBeenCalledWith({
        where: { projectId: PROJECT_ID, deletedAt: null },
        include: { items: { orderBy: { stepNumber: 'asc' } } },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual([mockSharedStep]);
    });

    it('throws NotFoundException when project not found', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(null);

      await expect(service.findAllByProject('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findOne', () => {
    it('returns a single shared step with items', async () => {
      mockPrisma.sharedStep.findFirst.mockResolvedValue(mockSharedStep);

      const result = await service.findOne(PROJECT_ID, SHARED_STEP_ID);

      expect(mockPrisma.sharedStep.findFirst).toHaveBeenCalledWith({
        where: { id: SHARED_STEP_ID, projectId: PROJECT_ID, deletedAt: null },
        include: { items: { orderBy: { stepNumber: 'asc' } } },
      });
      expect(result).toEqual(mockSharedStep);
    });

    it('throws NotFoundException when shared step not found', async () => {
      mockPrisma.sharedStep.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne(PROJECT_ID, 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates the title of a shared step', async () => {
      const updated = { ...mockSharedStep, title: 'Updated login flow' };
      mockPrisma.sharedStep.findFirst.mockResolvedValue(mockSharedStep);
      mockTx.sharedStep.update.mockResolvedValue(updated);
      mockTx.sharedStep.findUnique.mockResolvedValue(updated);

      const result = await service.update(PROJECT_ID, SHARED_STEP_ID, {
        title: 'Updated login flow',
      });

      expect(mockTx.sharedStep.update).toHaveBeenCalledWith({
        where: { id: SHARED_STEP_ID },
        data: { title: 'Updated login flow' },
      });
      expect(result).toEqual(updated);
    });

    it('replaces items when items are provided', async () => {
      const newItems = [
        { description: 'New step 1', expectedResult: 'New result 1' },
      ];
      const updated = {
        ...mockSharedStep,
        items: [
          {
            id: 'ssi-3',
            sharedStepId: SHARED_STEP_ID,
            stepNumber: 1,
            description: 'New step 1',
            expectedResult: 'New result 1',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      };
      mockPrisma.sharedStep.findFirst.mockResolvedValue(mockSharedStep);
      mockTx.sharedStepItem.deleteMany.mockResolvedValue({ count: 2 });
      mockTx.sharedStepItem.createMany.mockResolvedValue({ count: 1 });
      mockTx.sharedStep.findUnique.mockResolvedValue(updated);

      const result = await service.update(PROJECT_ID, SHARED_STEP_ID, {
        items: newItems,
      });

      expect(mockTx.sharedStepItem.deleteMany).toHaveBeenCalledWith({
        where: { sharedStepId: SHARED_STEP_ID },
      });
      expect(mockTx.sharedStepItem.createMany).toHaveBeenCalledWith({
        data: [
          {
            sharedStepId: SHARED_STEP_ID,
            stepNumber: 1,
            description: 'New step 1',
            expectedResult: 'New result 1',
          },
        ],
      });
      expect(result).toEqual(updated);
    });

    it('throws NotFoundException when shared step not found', async () => {
      mockPrisma.sharedStep.findFirst.mockResolvedValue(null);

      await expect(
        service.update(PROJECT_ID, 'nonexistent', { title: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('softDelete', () => {
    it('sets deletedAt on the shared step', async () => {
      const deleted = { ...mockSharedStep, deletedAt: new Date() };
      mockPrisma.sharedStep.findFirst.mockResolvedValue(mockSharedStep);
      mockPrisma.sharedStep.update.mockResolvedValue(deleted);

      const result = await service.softDelete(PROJECT_ID, SHARED_STEP_ID);

      expect(mockPrisma.sharedStep.update).toHaveBeenCalledWith({
        where: { id: SHARED_STEP_ID },
        data: { deletedAt: expect.any(Date) },
        include: { items: { orderBy: { stepNumber: 'asc' } } },
      });
      expect(result.deletedAt).not.toBeNull();
    });

    it('throws NotFoundException when shared step not found', async () => {
      mockPrisma.sharedStep.findFirst.mockResolvedValue(null);

      await expect(
        service.softDelete(PROJECT_ID, 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
