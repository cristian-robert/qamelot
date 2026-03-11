import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Role } from '@app/shared';

const mockAuthService = {
  register: jest.fn(),
  login: jest.fn(),
  refreshTokens: jest.fn(),
  getProfile: jest.fn(),
};

const mockJwtService = {
  verify: jest.fn(),
};

const testUser = {
  id: '1',
  email: 'a@b.com',
  name: 'Alice',
  role: Role.TESTER,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockResponse = () => {
  const res: Record<string, jest.Mock> = {};
  res['cookie'] = jest.fn().mockReturnValue(res);
  res['clearCookie'] = jest.fn().mockReturnValue(res);
  res['json'] = jest.fn().mockReturnValue(res);
  res['status'] = jest.fn().mockReturnValue(res);
  return res;
};

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();
    controller = module.get<AuthController>(AuthController);
  });

  describe('register', () => {
    it('returns user DTO', async () => {
      mockAuthService.register.mockResolvedValue(testUser);
      const result = await controller.register({
        email: 'a@b.com',
        name: 'Alice',
        password: 'pass1234',
      } as never);
      expect(result).toEqual(testUser);
    });
  });

  describe('login', () => {
    it('sets httpOnly cookies and returns user', async () => {
      mockAuthService.login.mockResolvedValue({
        accessToken: 'at',
        refreshToken: 'rt',
        user: testUser,
      });
      const res = mockResponse();
      await controller.login(
        { email: 'a@b.com', password: 'pass1234' } as never,
        res as never,
      );
      expect(res['cookie']).toHaveBeenCalledWith(
        'access_token',
        'at',
        expect.objectContaining({ httpOnly: true }),
      );
      expect(res['cookie']).toHaveBeenCalledWith(
        'refresh_token',
        'rt',
        expect.objectContaining({ httpOnly: true }),
      );
      expect(res['json']).toHaveBeenCalledWith(testUser);
    });
  });

  describe('logout', () => {
    it('clears both auth cookies', async () => {
      const res = mockResponse();
      await controller.logout(res as never);
      expect(res['clearCookie']).toHaveBeenCalledWith('access_token');
      expect(res['clearCookie']).toHaveBeenCalledWith('refresh_token');
    });
  });

  describe('me', () => {
    it('returns current user profile', async () => {
      mockAuthService.getProfile.mockResolvedValue(testUser);
      const req = { user: { id: '1' } };
      const result = await controller.me(req as never);
      expect(result).toEqual(testUser);
      expect(mockAuthService.getProfile).toHaveBeenCalledWith('1');
    });
  });
});
