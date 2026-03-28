import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { Role } from '@app/shared';

const testUser = {
  id: 'user-1',
  email: 'alice@test.com',
  name: 'Alice',
  role: Role.TESTER,
  deletedAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const mockUsersService = {
  findAll: jest.fn(),
  findOneById: jest.fn(),
  updateRole: jest.fn(),
  softDelete: jest.fn(),
  invite: jest.fn(),
  updateProfile: jest.fn(),
};

describe('UsersController', () => {
  let controller: UsersController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    }).compile();
    controller = module.get<UsersController>(UsersController);
  });

  describe('findAll', () => {
    it('returns paginated users', async () => {
      const paginated = { data: [testUser], total: 1, page: 1, pageSize: 50, totalPages: 1 };
      mockUsersService.findAll.mockResolvedValue(paginated);

      const result = await controller.findAll();

      expect(result).toEqual(paginated);
      expect(mockUsersService.findAll).toHaveBeenCalledWith({
        page: undefined,
        pageSize: undefined,
      });
    });

    it('parses page and pageSize query strings', async () => {
      const paginated = { data: [], total: 0, page: 2, pageSize: 10, totalPages: 0 };
      mockUsersService.findAll.mockResolvedValue(paginated);

      const result = await controller.findAll('2', '10');

      expect(result).toEqual(paginated);
      expect(mockUsersService.findAll).toHaveBeenCalledWith({
        page: 2,
        pageSize: 10,
      });
    });
  });

  describe('findOne', () => {
    it('returns user by ID', async () => {
      mockUsersService.findOneById.mockResolvedValue(testUser);

      const result = await controller.findOne('user-1');

      expect(result).toEqual(testUser);
      expect(mockUsersService.findOneById).toHaveBeenCalledWith('user-1');
    });
  });

  describe('updateRole', () => {
    it('delegates to service with requester ID', async () => {
      mockUsersService.updateRole.mockResolvedValue({ ...testUser, role: Role.LEAD });
      const req = { user: { id: 'admin-1', role: Role.ADMIN } };

      const result = await controller.updateRole(
        'user-1',
        { role: Role.LEAD },
        req as never,
      );

      expect(result.role).toBe(Role.LEAD);
      expect(mockUsersService.updateRole).toHaveBeenCalledWith('user-1', Role.LEAD, 'admin-1');
    });
  });

  describe('remove', () => {
    it('delegates soft delete to service', async () => {
      const deleted = { ...testUser, deletedAt: '2026-03-16T00:00:00.000Z' };
      mockUsersService.softDelete.mockResolvedValue(deleted);
      const req = { user: { id: 'admin-1', role: Role.ADMIN } };

      const result = await controller.remove('user-1', req as never);

      expect(result.deletedAt).toBeTruthy();
      expect(mockUsersService.softDelete).toHaveBeenCalledWith('user-1', 'admin-1');
    });
  });

  describe('invite', () => {
    it('creates user and returns with temporary password', async () => {
      const invited = { ...testUser, temporaryPassword: 'temp123' };
      mockUsersService.invite.mockResolvedValue(invited);

      const result = await controller.invite({
        email: 'bob@test.com',
        name: 'Bob',
        role: Role.TESTER,
      });

      expect(result).toHaveProperty('temporaryPassword');
      expect(mockUsersService.invite).toHaveBeenCalledWith({
        email: 'bob@test.com',
        name: 'Bob',
        role: Role.TESTER,
      });
    });
  });

  describe('updateProfile', () => {
    it('updates current user profile', async () => {
      const updated = { ...testUser, name: 'New Name' };
      mockUsersService.updateProfile.mockResolvedValue(updated);
      const req = { user: { id: 'user-1', role: Role.TESTER } };

      const result = await controller.updateProfile(req as never, { name: 'New Name' });

      expect(result.name).toBe('New Name');
      expect(mockUsersService.updateProfile).toHaveBeenCalledWith('user-1', { name: 'New Name' });
    });
  });
});
