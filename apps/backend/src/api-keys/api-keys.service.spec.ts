import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ApiKeysService', () => {
  let service: ApiKeysService;
  const mockPrisma = {
    apiKey: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    project: { findFirst: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiKeysService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<ApiKeysService>(ApiKeysService);
  });

  describe('create', () => {
    it('creates an API key and returns rawKey only once', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: 'proj-1' });
      mockPrisma.apiKey.create.mockResolvedValue({
        id: 'key-1',
        name: 'CI Key',
        keyPrefix: 'qam_abcd',
        keyHash: 'hashed',
        projectId: 'proj-1',
        createdById: 'user-1',
        lastUsedAt: null,
        expiresAt: null,
        revokedAt: null,
        createdAt: new Date(),
      });

      const result = await service.create(
        { name: 'CI Key', projectId: 'proj-1' },
        'user-1',
      );
      expect(result.rawKey).toBeDefined();
      expect(result.rawKey).toMatch(/^qam_/);
      expect(result.name).toBe('CI Key');
      expect(mockPrisma.apiKey.create).toHaveBeenCalled();
    });

    it('throws NotFoundException when project not found', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(null);
      await expect(
        service.create({ name: 'Key', projectId: 'bad' }, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('listByProject', () => {
    it('returns all non-revoked keys for a project', async () => {
      mockPrisma.apiKey.findMany.mockResolvedValue([
        {
          id: 'key-1',
          name: 'CI',
          keyPrefix: 'qam_abcd',
          projectId: 'proj-1',
          createdById: 'user-1',
          lastUsedAt: null,
          expiresAt: null,
          revokedAt: null,
          createdAt: new Date(),
        },
      ]);
      const result = await service.listByProject('proj-1');
      expect(result).toHaveLength(1);
      expect(mockPrisma.apiKey.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { projectId: 'proj-1', revokedAt: null },
        }),
      );
    });
  });

  describe('revoke', () => {
    it('revokes an existing key', async () => {
      mockPrisma.apiKey.findFirst.mockResolvedValue({
        id: 'key-1',
        projectId: 'proj-1',
        revokedAt: null,
      });
      mockPrisma.apiKey.update.mockResolvedValue({
        id: 'key-1',
        name: 'CI',
        keyPrefix: 'qam_',
        projectId: 'proj-1',
        createdById: 'u1',
        lastUsedAt: null,
        expiresAt: null,
        revokedAt: new Date(),
        createdAt: new Date(),
      });
      const result = await service.revoke('key-1', 'proj-1');
      expect(result.revokedAt).toBeDefined();
    });

    it('throws NotFoundException when key not found', async () => {
      mockPrisma.apiKey.findFirst.mockResolvedValue(null);
      await expect(service.revoke('bad', 'proj-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
