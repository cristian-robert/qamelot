import { SetMetadata } from '@nestjs/common';
import { Permission } from '@app/shared';

export const REQUIRED_PERMISSIONS_KEY = 'requiredPermissions';
export const RequirePermission = (...permissions: Permission[]) =>
  SetMetadata(REQUIRED_PERMISSIONS_KEY, permissions);
