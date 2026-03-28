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
      count: jest.fn(),
    },
    testResult: {
      findUnique: jest.fn(),
    },
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

    it('creates a defect linked to a test result', async () => {
      const linkedDefect = { ...testDefect, testResultId: 'result-1' };
      mockPrisma.testResult.findUnique.mockResolvedValue({ id: 'result-1' });
      mockPrisma.defect.create.mockResolvedValue(linkedDefect);

      const result = await service.create('proj-1', {
        reference: 'PROJ-123',
        description: 'Login fails',
        testResultId: 'result-1',
      });

      expect(mockPrisma.testResult.findUnique).toHaveBeenCalledWith({
        where: { id: 'result-1' },
      });
      expect(mockPrisma.defect.create).toHaveBeenCalledWith({
        data: {
          reference: 'PROJ-123',
          description: 'Login fails',
          testResultId: 'result-1',
          projectId: 'proj-1',
        },
      });
      expect(result).toEqual(linkedDefect);
    });

    it('throws NotFoundException when linked test result not found', async () => {
      mockPrisma.testResult.findUnique.mockResolvedValue(null);

      await expect(
        service.create('proj-1', {
          reference: 'PROJ-123',
          testResultId: 'nonexistent',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAllByProject', () => {
    it('returns paginated active defects for the project', async () => {
      mockPrisma.defect.findMany.mockResolvedValue([testDefect]);
      mockPrisma.defect.count.mockResolvedValue(1);

      const result = await service.findAllByProject('proj-1');

      expect(mockPrisma.defect.findMany).toHaveBeenCalledWith({
        where: { projectId: 'proj-1', deletedAt: null },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 50,
      });
      expect(mockPrisma.defect.count).toHaveBeenCalledWith({
        where: { projectId: 'proj-1', deletedAt: null },
      });
      expect(result).toEqual({
        data: [testDefect],
        total: 1,
        page: 1,
        pageSize: 50,
        totalPages: 1,
      });
    });

    it('filters by search text across reference and description', async () => {
      mockPrisma.defect.findMany.mockResolvedValue([testDefect]);
      mockPrisma.defect.count.mockResolvedValue(1);

      await service.findAllByProject('proj-1', { search: 'login' });

      expect(mockPrisma.defect.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            projectId: 'proj-1',
            deletedAt: null,
            OR: [
              { reference: { contains: 'login', mode: 'insensitive' } },
              { description: { contains: 'login', mode: 'insensitive' } },
            ],
          },
        }),
      );
    });

    it('does not add search filter when value is empty string', async () => {
      mockPrisma.defect.findMany.mockResolvedValue([]);
      mockPrisma.defect.count.mockResolvedValue(0);

      await service.findAllByProject('proj-1', { search: '' });

      expect(mockPrisma.defect.findMany).toHaveBeenCalledWith(
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

  describe('findOne', () => {
    it('returns defect with test result context when found', async () => {
      const defectWithResult = {
        ...testDefect,
        testResultId: 'result-1',
        testResult: {
          id: 'result-1',
          status: 'FAILED',
          comment: 'Button did not respond',
          testRunId: 'run-1',
          testRunCase: { suite: { id: 'suite-1', name: 'Login Suite' } },
          testRun: { id: 'run-1', name: 'Smoke Run' },
        },
      };
      mockPrisma.defect.findFirst.mockResolvedValue(defectWithResult);

      const result = await service.findOne('def-1');

      expect(mockPrisma.defect.findFirst).toHaveBeenCalledWith({
        where: { id: 'def-1', deletedAt: null },
        include: {
          testResult: {
            select: {
              id: true,
              status: true,
              comment: true,
              testRunId: true,
              testRunCase: {
                select: {
                  testCase: { select: { id: true, title: true } },
                },
              },
              testRun: {
                select: { id: true, name: true },
              },
            },
          },
        },
      });
      expect(result).toEqual(defectWithResult);
    });

    it('throws NotFoundException when defect not found', async () => {
      mockPrisma.defect.findFirst.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByTestResultId', () => {
    it('returns defects linked to a test result', async () => {
      const linkedDefect = { ...testDefect, testResultId: 'result-1' };
      mockPrisma.defect.findMany.mockResolvedValue([linkedDefect]);

      const result = await service.findByTestResultId('result-1');

      expect(mockPrisma.defect.findMany).toHaveBeenCalledWith({
        where: { testResultId: 'result-1', deletedAt: null },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual([linkedDefect]);
    });

    it('returns empty array when no defects linked', async () => {
      mockPrisma.defect.findMany.mockResolvedValue([]);

      const result = await service.findByTestResultId('result-no-defects');

      expect(result).toEqual([]);
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
