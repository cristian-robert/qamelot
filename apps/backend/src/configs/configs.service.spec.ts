import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigsService } from './configs.service';

const PROJECT_ID = 'proj-1';
const GROUP_ID = 'group-1';
const ITEM_ID = 'item-1';

const mockProject = {
  id: PROJECT_ID,
  name: 'Test Project',
  deletedAt: null,
};

const mockGroup = {
  id: GROUP_ID,
  name: 'Browser',
  projectId: PROJECT_ID,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  items: [],
};

const mockItem = {
  id: ITEM_ID,
  name: 'Chrome',
  groupId: GROUP_ID,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('ConfigsService', () => {
  let service: ConfigsService;

  const mockPrisma = {
    project: {
      findFirst: jest.fn(),
    },
    configGroup: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    configItem: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfigsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<ConfigsService>(ConfigsService);
  });

  describe('createGroup', () => {
    it('creates a config group', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(mockProject);
      mockPrisma.configGroup.create.mockResolvedValue(mockGroup);

      const result = await service.createGroup(PROJECT_ID, { name: 'Browser' });

      expect(mockPrisma.configGroup.create).toHaveBeenCalledWith({
        data: { name: 'Browser', projectId: PROJECT_ID },
        include: { items: true },
      });
      expect(result).toEqual(mockGroup);
    });

    it('throws NotFoundException when project not found', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(null);

      await expect(
        service.createGroup('nonexistent', { name: 'Browser' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAllGroups', () => {
    it('returns all groups with items for a project', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(mockProject);
      mockPrisma.configGroup.findMany.mockResolvedValue([mockGroup]);

      const result = await service.findAllGroups(PROJECT_ID);

      expect(mockPrisma.configGroup.findMany).toHaveBeenCalledWith({
        where: { projectId: PROJECT_ID, deletedAt: null },
        orderBy: { createdAt: 'asc' },
        include: {
          items: {
            where: { deletedAt: null },
            orderBy: { createdAt: 'asc' },
          },
        },
      });
      expect(result).toEqual([mockGroup]);
    });

    it('throws NotFoundException when project not found', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(null);

      await expect(service.findAllGroups('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findOneGroup', () => {
    it('returns a group with items', async () => {
      mockPrisma.configGroup.findFirst.mockResolvedValue(mockGroup);

      const result = await service.findOneGroup(GROUP_ID);
      expect(result).toEqual(mockGroup);
    });

    it('throws NotFoundException when group not found', async () => {
      mockPrisma.configGroup.findFirst.mockResolvedValue(null);

      await expect(service.findOneGroup('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateGroup', () => {
    it('updates the group name', async () => {
      const updated = { ...mockGroup, name: 'OS' };
      mockPrisma.configGroup.findFirst.mockResolvedValue(mockGroup);
      mockPrisma.configGroup.update.mockResolvedValue(updated);

      const result = await service.updateGroup(GROUP_ID, { name: 'OS' });

      expect(mockPrisma.configGroup.update).toHaveBeenCalledWith({
        where: { id: GROUP_ID },
        data: { name: 'OS' },
        include: {
          items: {
            where: { deletedAt: null },
            orderBy: { createdAt: 'asc' },
          },
        },
      });
      expect(result.name).toBe('OS');
    });

    it('throws NotFoundException when group not found', async () => {
      mockPrisma.configGroup.findFirst.mockResolvedValue(null);

      await expect(
        service.updateGroup('nonexistent', { name: 'OS' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('softDeleteGroup', () => {
    it('sets deletedAt on the group', async () => {
      const deleted = { ...mockGroup, deletedAt: new Date() };
      mockPrisma.configGroup.findFirst.mockResolvedValue(mockGroup);
      mockPrisma.configGroup.update.mockResolvedValue(deleted);

      const result = await service.softDeleteGroup(GROUP_ID);

      expect(mockPrisma.configGroup.update).toHaveBeenCalledWith({
        where: { id: GROUP_ID },
        data: { deletedAt: expect.any(Date) },
      });
      expect(result.deletedAt).not.toBeNull();
    });

    it('throws NotFoundException when group not found', async () => {
      mockPrisma.configGroup.findFirst.mockResolvedValue(null);

      await expect(service.softDeleteGroup('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createItem', () => {
    it('creates a config item in a group', async () => {
      mockPrisma.configGroup.findFirst.mockResolvedValue(mockGroup);
      mockPrisma.configItem.create.mockResolvedValue(mockItem);

      const result = await service.createItem(GROUP_ID, { name: 'Chrome' });

      expect(mockPrisma.configItem.create).toHaveBeenCalledWith({
        data: { name: 'Chrome', groupId: GROUP_ID },
      });
      expect(result).toEqual(mockItem);
    });

    it('throws NotFoundException when group not found', async () => {
      mockPrisma.configGroup.findFirst.mockResolvedValue(null);

      await expect(
        service.createItem('nonexistent', { name: 'Chrome' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateItem', () => {
    it('updates item name', async () => {
      const updated = { ...mockItem, name: 'Firefox' };
      mockPrisma.configItem.findFirst.mockResolvedValue(mockItem);
      mockPrisma.configItem.update.mockResolvedValue(updated);

      const result = await service.updateItem(ITEM_ID, { name: 'Firefox' });

      expect(mockPrisma.configItem.update).toHaveBeenCalledWith({
        where: { id: ITEM_ID },
        data: { name: 'Firefox' },
      });
      expect(result.name).toBe('Firefox');
    });

    it('throws NotFoundException when item not found', async () => {
      mockPrisma.configItem.findFirst.mockResolvedValue(null);

      await expect(
        service.updateItem('nonexistent', { name: 'Firefox' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('softDeleteItem', () => {
    it('sets deletedAt on the item', async () => {
      const deleted = { ...mockItem, deletedAt: new Date() };
      mockPrisma.configItem.findFirst.mockResolvedValue(mockItem);
      mockPrisma.configItem.update.mockResolvedValue(deleted);

      const result = await service.softDeleteItem(ITEM_ID);

      expect(mockPrisma.configItem.update).toHaveBeenCalledWith({
        where: { id: ITEM_ID },
        data: { deletedAt: expect.any(Date) },
      });
      expect(result.deletedAt).not.toBeNull();
    });

    it('throws NotFoundException when item not found', async () => {
      mockPrisma.configItem.findFirst.mockResolvedValue(null);

      await expect(service.softDeleteItem('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
