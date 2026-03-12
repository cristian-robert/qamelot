import { SetMetadata } from '@nestjs/common';
import { Role } from '@app/shared';

export const REQUIRED_ROLES_KEY = 'requiredRoles';
export const Roles = (...roles: Role[]) => SetMetadata(REQUIRED_ROLES_KEY, roles);
