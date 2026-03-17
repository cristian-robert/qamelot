import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ApiKeyAuthGuard } from './api-key-auth.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { createHash } from 'crypto';

describe('ApiKeyAuthGuard', () => {
  let guard: ApiKeyAuthGuard;
  const mockPrisma = {
    apiKey: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new ApiKeyAuthGuard(mockPrisma as unknown as PrismaService);
  });

  const mockContext = (apiKey?: string): ExecutionContext => {
    const req = {
      headers: apiKey ? { 'x-api-key': apiKey } : {},
    };
    return {
      switchToHttp: () => ({ getRequest: () => req }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
  };

  it('throws UnauthorizedException when no X-API-Key header', async () => {
    await expect(guard.canActivate(mockContext())).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('throws UnauthorizedException when key not found', async () => {
    mockPrisma.apiKey.findUnique.mockResolvedValue(null);
    await expect(guard.canActivate(mockContext('qam_bad_key'))).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('throws UnauthorizedException when key is revoked', async () => {
    mockPrisma.apiKey.findUnique.mockResolvedValue({
      id: 'key-1',
      revokedAt: new Date(),
      expiresAt: null,
      projectId: 'proj-1',
    });
    await expect(guard.canActivate(mockContext('qam_valid'))).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('throws UnauthorizedException when key is expired', async () => {
    mockPrisma.apiKey.findUnique.mockResolvedValue({
      id: 'key-1',
      revokedAt: null,
      expiresAt: new Date('2020-01-01'),
      projectId: 'proj-1',
    });
    await expect(guard.canActivate(mockContext('qam_valid'))).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('allows valid non-expired, non-revoked key and sets req.apiKey', async () => {
    const rawKey = 'qam_test_key_abc123';
    const keyHash = createHash('sha256').update(rawKey).digest('hex');
    mockPrisma.apiKey.findUnique.mockResolvedValue({
      id: 'key-1',
      revokedAt: null,
      expiresAt: null,
      projectId: 'proj-1',
    });
    mockPrisma.apiKey.update.mockResolvedValue({});

    const ctx = mockContext(rawKey);
    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
    expect(mockPrisma.apiKey.findUnique).toHaveBeenCalledWith({
      where: { keyHash },
    });
    const req = ctx.switchToHttp().getRequest();
    expect((req as Record<string, unknown>).apiKey).toEqual({
      id: 'key-1',
      projectId: 'proj-1',
    });
  });
});
