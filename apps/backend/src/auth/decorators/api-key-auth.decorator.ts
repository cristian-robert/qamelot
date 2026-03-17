import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { ApiKeyAuthGuard } from '../guards/api-key-auth.guard';
import { IS_PUBLIC_KEY } from './public.decorator';

/**
 * Marks an endpoint as using API key auth instead of JWT.
 * Bypasses JWT guard (via @Public) and applies ApiKeyAuthGuard.
 */
export const ApiKeyAuth = () =>
  applyDecorators(
    SetMetadata(IS_PUBLIC_KEY, true),
    UseGuards(ApiKeyAuthGuard),
  );
