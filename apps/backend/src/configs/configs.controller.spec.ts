import { Test, TestingModule } from '@nestjs/testing';
import { ConfigsController } from './configs.controller';
import { ConfigsService } from './configs.service';

const PROJECT_ID = 'proj-1';
const GROUP_ID = 'group-1';
const ITEM_ID = 'item-1';

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

describe('ConfigsController', () => {
  let controller: ConfigsController;

  const mockService = {
    createGroup: jest.fn(),
    findAllGroups: jest.fn(),
    findOneGroup: jest.fn(),
    updateGroup: jest.fn(),
    softDeleteGroup: jest.fn(),
    createItem: jest.fn(),
    updateItem: jest.fn(),
    softDeleteItem: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConfigsController],
      providers: [{ provide: ConfigsService, useValue: mockService }],
    }).compile();
    controller = module.get<ConfigsController>(ConfigsController);
  });

  it('createGroup delegates to service', async () => {
    mockService.createGroup.mockResolvedValue(mockGroup);

    const result = await controller.createGroup(PROJECT_ID, { name: 'Browser' });

    expect(mockService.createGroup).toHaveBeenCalledWith(PROJECT_ID, { name: 'Browser' });
    expect(result).toEqual(mockGroup);
  });

  it('findAllGroups delegates to service', async () => {
    mockService.findAllGroups.mockResolvedValue([mockGroup]);

    const result = await controller.findAllGroups(PROJECT_ID);

    expect(mockService.findAllGroups).toHaveBeenCalledWith(PROJECT_ID);
    expect(result).toEqual([mockGroup]);
  });

  it('findOneGroup delegates to service', async () => {
    mockService.findOneGroup.mockResolvedValue(mockGroup);

    const result = await controller.findOneGroup(GROUP_ID);

    expect(mockService.findOneGroup).toHaveBeenCalledWith(GROUP_ID);
    expect(result).toEqual(mockGroup);
  });

  it('updateGroup delegates to service', async () => {
    const updated = { ...mockGroup, name: 'OS' };
    mockService.updateGroup.mockResolvedValue(updated);

    const result = await controller.updateGroup(GROUP_ID, { name: 'OS' });

    expect(mockService.updateGroup).toHaveBeenCalledWith(GROUP_ID, { name: 'OS' });
    expect(result).toEqual(updated);
  });

  it('removeGroup delegates to service', async () => {
    const deleted = { ...mockGroup, deletedAt: new Date() };
    mockService.softDeleteGroup.mockResolvedValue(deleted);

    const result = await controller.removeGroup(GROUP_ID);

    expect(mockService.softDeleteGroup).toHaveBeenCalledWith(GROUP_ID);
    expect(result).toEqual(deleted);
  });

  it('createItem delegates to service', async () => {
    mockService.createItem.mockResolvedValue(mockItem);

    const result = await controller.createItem(GROUP_ID, { name: 'Chrome' });

    expect(mockService.createItem).toHaveBeenCalledWith(GROUP_ID, { name: 'Chrome' });
    expect(result).toEqual(mockItem);
  });

  it('updateItem delegates to service', async () => {
    const updated = { ...mockItem, name: 'Firefox' };
    mockService.updateItem.mockResolvedValue(updated);

    const result = await controller.updateItem(ITEM_ID, { name: 'Firefox' });

    expect(mockService.updateItem).toHaveBeenCalledWith(ITEM_ID, { name: 'Firefox' });
    expect(result).toEqual(updated);
  });

  it('removeItem delegates to service', async () => {
    const deleted = { ...mockItem, deletedAt: new Date() };
    mockService.softDeleteItem.mockResolvedValue(deleted);

    const result = await controller.removeItem(ITEM_ID);

    expect(mockService.softDeleteItem).toHaveBeenCalledWith(ITEM_ID);
    expect(result).toEqual(deleted);
  });
});
