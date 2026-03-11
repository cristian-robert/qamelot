import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@app/shared';
import { REQUIRED_ROLES_KEY } from '../decorators/roles.decorator';

const ROLE_HIERARCHY: Record<Role, number> = {
  [Role.ADMIN]: 4,
  [Role.LEAD]: 3,
  [Role.TESTER]: 2,
  [Role.VIEWER]: 1,
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[]>(REQUIRED_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const { user } = context.switchToHttp().getRequest<{ user: { role: Role } }>();
    return required.some((r) => ROLE_HIERARCHY[user.role] >= ROLE_HIERARCHY[r]);
  }
}
