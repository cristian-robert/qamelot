import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { Role } from '@app/shared';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs');

const mockUsersService = {
  findByEmail: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn(),
};

const testUser = {
  id: 'user-1',
  email: 'alice@test.com',
  name: 'Alice',
  role: Role.TESTER,
  password: 'hashed',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();
    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('hashes password and creates user', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-pw');
      mockUsersService.create.mockResolvedValue(testUser);

      const result = await service.register({ email: 'alice@test.com', name: 'Alice', password: 'password123' });

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
      expect(mockUsersService.create).toHaveBeenCalledWith({
        email: 'alice@test.com',
        name: 'Alice',
        passwordHash: 'hashed-pw',
      });
      expect(result).not.toHaveProperty('password');
      expect(result).toMatchObject({ id: testUser.id, email: testUser.email });
    });

    it('throws ConflictException if email already exists', async () => {
      mockUsersService.findByEmail.mockResolvedValue(testUser);
      await expect(service.register({ email: 'alice@test.com', name: 'Alice', password: 'pass1234' }))
        .rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('returns access/refresh tokens and user on valid credentials', async () => {
      mockUsersService.findByEmail.mockResolvedValue(testUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign.mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');

      const result = await service.login({ email: 'alice@test.com', password: 'password123' });

      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: expect.objectContaining({ id: testUser.id, email: testUser.email }),
      });
      expect(result.user).not.toHaveProperty('password');
    });

    it('throws UnauthorizedException on wrong password', async () => {
      mockUsersService.findByEmail.mockResolvedValue(testUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      await expect(service.login({ email: 'alice@test.com', password: 'wrong' }))
        .rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      await expect(service.login({ email: 'nobody@test.com', password: 'pass' }))
        .rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getProfile', () => {
    it('returns user without password field', async () => {
      mockUsersService.findById.mockResolvedValue(testUser);
      const result = await service.getProfile('user-1');
      expect(result).not.toHaveProperty('password');
      expect(result).toMatchObject({ id: testUser.id, email: testUser.email });
    });

    it('throws UnauthorizedException when user not found', async () => {
      mockUsersService.findById.mockResolvedValue(null);
      await expect(service.getProfile('missing')).rejects.toThrow(UnauthorizedException);
    });
  });
});
