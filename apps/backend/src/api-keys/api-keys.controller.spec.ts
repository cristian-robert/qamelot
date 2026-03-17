import { Test, TestingModule } from '@nestjs/testing';
import { ApiKeysController } from './api-keys.controller';
import { ApiKeysService } from './api-keys.service';

describe('ApiKeysController', () => {
  let controller: ApiKeysController;
  const mockService = {
    create: jest.fn(),
    listByProject: jest.fn(),
    revoke: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApiKeysController],
      providers: [{ provide: ApiKeysService, useValue: mockService }],
    }).compile();
    controller = module.get<ApiKeysController>(ApiKeysController);
  });

  it('create delegates to service with user id', async () => {
    mockService.create.mockResolvedValue({ id: 'key-1', rawKey: 'qam_abc' });
    const req = { user: { id: 'user-1' } };
    const result = await controller.create(
      { name: 'CI Key', projectId: 'proj-1' },
      req,
    );
    expect(mockService.create).toHaveBeenCalledWith(
      { name: 'CI Key', projectId: 'proj-1' },
      'user-1',
    );
    expect(result.rawKey).toBe('qam_abc');
  });

  it('list delegates to service', async () => {
    mockService.listByProject.mockResolvedValue([]);
    const result = await controller.list('proj-1');
    expect(mockService.listByProject).toHaveBeenCalledWith('proj-1');
    expect(result).toEqual([]);
  });

  it('revoke delegates to service', async () => {
    mockService.revoke.mockResolvedValue({ id: 'key-1', revokedAt: 'now' });
    const result = await controller.revoke('proj-1', 'key-1');
    expect(mockService.revoke).toHaveBeenCalledWith('key-1', 'proj-1');
    expect(result.revokedAt).toBe('now');
  });
});
