import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role, Permission, ROLE_PERMISSIONS } from '@app/shared';
import { REQUIRED_PERMISSIONS_KEY } from '../decorators/require-permission.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Permission[]>(
      REQUIRED_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required || required.length === 0) return true;

    const { user } = context.switchToHttp().getRequest<{ user?: { role: Role } }>();
    if (!user) return false;

    const userPermissions = ROLE_PERMISSIONS[user.role] ?? [];
    return required.every((p) => userPermissions.includes(p));
  }
}
