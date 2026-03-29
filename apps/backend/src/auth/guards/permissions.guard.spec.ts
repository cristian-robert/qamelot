import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { PermissionsGuard } from './permissions.guard';
import { Permission } from '@app/shared';

function mockContext(role?: string): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => (role ? { user: { role } } : {}),
    }),
  } as unknown as ExecutionContext;
}

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new PermissionsGuard(reflector);
  });

  it('should allow when no permissions are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    expect(guard.canActivate(mockContext('TESTER'))).toBe(true);
  });

  it('should deny when user is missing', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Permission.MANAGE_USERS]);
    expect(guard.canActivate(mockContext())).toBe(false);
  });

  it('should allow ADMIN for any permission', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Permission.MANAGE_USERS]);
    expect(guard.canActivate(mockContext('ADMIN'))).toBe(true);
  });

  it('should deny LEAD for MANAGE_USERS', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Permission.MANAGE_USERS]);
    expect(guard.canActivate(mockContext('LEAD'))).toBe(false);
  });

  it('should allow LEAD for MANAGE_CASES', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Permission.MANAGE_CASES]);
    expect(guard.canActivate(mockContext('LEAD'))).toBe(true);
  });

  it('should allow TESTER for EDIT_CASES', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Permission.EDIT_CASES]);
    expect(guard.canActivate(mockContext('TESTER'))).toBe(true);
  });

  it('should deny TESTER for MANAGE_CASES', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Permission.MANAGE_CASES]);
    expect(guard.canActivate(mockContext('TESTER'))).toBe(false);
  });

  it('should deny VIEWER for EDIT_CASES', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Permission.EDIT_CASES]);
    expect(guard.canActivate(mockContext('VIEWER'))).toBe(false);
  });

  it('should require ALL permissions (not any)', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([
      Permission.MANAGE_CASES,
      Permission.MANAGE_USERS,
    ]);
    expect(guard.canActivate(mockContext('LEAD'))).toBe(false);
  });
});
