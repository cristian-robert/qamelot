import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@app/shared';

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
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
      const user = { id: '1', email: 'a@b.com', name: 'Alice', role: Role.TESTER, password: 'hash', createdAt: new Date(), updatedAt: new Date() };
      mockPrisma.user.findUnique.mockResolvedValue(user);
      const result = await service.findByEmail('a@b.com');
      expect(result).toEqual(user);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'a@b.com' } });
    });

    it('returns null when not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      const result = await service.findByEmail('missing@b.com');
      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('returns user when found', async () => {
      const user = { id: '1', email: 'a@b.com', name: 'Alice', role: Role.TESTER, password: 'hash', createdAt: new Date(), updatedAt: new Date() };
      mockPrisma.user.findUnique.mockResolvedValue(user);
      const result = await service.findById('1');
      expect(result).toEqual(user);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { id: '1' } });
    });
  });

  describe('create', () => {
    it('creates and returns new user', async () => {
      const user = { id: '2', email: 'b@c.com', name: 'Bob', role: Role.TESTER, password: 'hash', createdAt: new Date(), updatedAt: new Date() };
      mockPrisma.user.create.mockResolvedValue(user);
      const result = await service.create({ email: 'b@c.com', name: 'Bob', passwordHash: 'hash' });
      expect(result).toEqual(user);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: { email: 'b@c.com', name: 'Bob', password: 'hash', role: Role.TESTER },
      });
    });
  });
});
