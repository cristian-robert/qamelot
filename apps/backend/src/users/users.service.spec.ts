import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@app/shared';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs');

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

const testUser = {
  id: 'user-1',
  email: 'alice@test.com',
  name: 'Alice',
  role: Role.TESTER,
  password: 'hashed',
  deletedAt: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<UsersService>(UsersService);
  });

  describe('findByEmail', () => {
    it('returns user when found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(testUser);
      const result = await service.findByEmail('alice@test.com');
      expect(result).toEqual(testUser);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'alice@test.com' } });
    });

    it('returns null when not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      const result = await service.findByEmail('missing@b.com');
      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('returns user when found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(testUser);
      const result = await service.findById('user-1');
      expect(result).toEqual(testUser);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 'user-1' } });
    });
  });

  describe('create', () => {
    it('creates and returns new user', async () => {
      mockPrisma.user.create.mockResolvedValue(testUser);
      const result = await service.create({ email: 'alice@test.com', name: 'Alice', passwordHash: 'hash' });
      expect(result).toEqual(testUser);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: { email: 'alice@test.com', name: 'Alice', password: 'hash', role: Role.TESTER },
      });
    });
  });

  describe('findAll', () => {
    it('returns array of user DTOs without passwords', async () => {
      mockPrisma.user.findMany.mockResolvedValue([testUser]);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(result[0]).not.toHaveProperty('password');
      expect(result[0]).toMatchObject({ id: 'user-1', email: 'alice@test.com' });
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findOneById', () => {
    it('returns user DTO when found', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(testUser);

      const result = await service.findOneById('user-1');

      expect(result).toMatchObject({ id: 'user-1' });
      expect(result).not.toHaveProperty('password');
    });

    it('throws NotFoundException when user not found', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(service.findOneById('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateRole', () => {
    it('updates user role and returns DTO', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(testUser);
      mockPrisma.user.update.mockResolvedValue({ ...testUser, role: Role.LEAD });

      const result = await service.updateRole('user-1', Role.LEAD, 'admin-1');

      expect(result.role).toBe(Role.LEAD);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { role: Role.LEAD },
      });
    });

    it('throws ForbiddenException when changing own role', async () => {
      await expect(service.updateRole('user-1', Role.ADMIN, 'user-1'))
        .rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException when target user not found', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(service.updateRole('missing', Role.LEAD, 'admin-1'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('softDelete', () => {
    it('sets deletedAt and returns DTO', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(testUser);
      const deletedUser = { ...testUser, deletedAt: new Date() };
      mockPrisma.user.update.mockResolvedValue(deletedUser);

      const result = await service.softDelete('user-1', 'admin-1');

      expect(result.deletedAt).toBeTruthy();
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('throws ForbiddenException when deactivating self', async () => {
      await expect(service.softDelete('user-1', 'user-1'))
        .rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException when user not found', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(service.softDelete('missing', 'admin-1'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('invite', () => {
    it('creates user with hashed temporary password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-temp');
      mockPrisma.user.create.mockResolvedValue({
        ...testUser,
        email: 'bob@test.com',
        name: 'Bob',
        role: Role.TESTER,
      });

      const result = await service.invite({
        email: 'bob@test.com',
        name: 'Bob',
        role: 'TESTER',
      });

      expect(result).toHaveProperty('temporaryPassword');
      expect(result.email).toBe('bob@test.com');
      expect(bcrypt.hash).toHaveBeenCalledWith(expect.any(String), 12);
    });

    it('throws ConflictException if email already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(testUser);

      await expect(service.invite({
        email: 'alice@test.com',
        name: 'Alice',
        role: 'TESTER',
      })).rejects.toThrow(ConflictException);
    });
  });

  describe('updateProfile', () => {
    it('updates name when provided', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(testUser);
      mockPrisma.user.update.mockResolvedValue({ ...testUser, name: 'New Name' });

      const result = await service.updateProfile('user-1', { name: 'New Name' });

      expect(result.name).toBe('New Name');
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { name: 'New Name' },
      });
    });

    it('updates password when current password is correct', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(testUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed');
      mockPrisma.user.update.mockResolvedValue(testUser);

      await service.updateProfile('user-1', {
        currentPassword: 'oldpass',
        newPassword: 'newpass123',
      });

      expect(bcrypt.compare).toHaveBeenCalledWith('oldpass', 'hashed');
      expect(bcrypt.hash).toHaveBeenCalledWith('newpass123', 12);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { password: 'new-hashed' },
      });
    });

    it('throws UnauthorizedException when new password without current', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(testUser);

      await expect(service.updateProfile('user-1', {
        newPassword: 'newpass123',
      })).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when current password is wrong', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(testUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.updateProfile('user-1', {
        currentPassword: 'wrong',
        newPassword: 'newpass123',
      })).rejects.toThrow(UnauthorizedException);
    });

    it('throws NotFoundException when user not found', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(service.updateProfile('missing', { name: 'New' }))
        .rejects.toThrow(NotFoundException);
    });
  });
});
