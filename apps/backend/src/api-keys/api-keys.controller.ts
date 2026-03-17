import { Controller, Post, Get, Delete, Body, Param, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Role } from '@app/shared';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';

@ApiTags('api-keys')
@Controller('projects/:projectId/api-keys')
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post()
  @Roles(Role.ADMIN, Role.LEAD)
  @ApiOperation({ summary: 'Create an API key for a project' })
  @ApiResponse({ status: 201, description: 'API key created — raw key in response (shown only once)' })
  create(
    @Body() dto: CreateApiKeyDto,
    @Req() req: { user: { id: string } },
  ) {
    return this.apiKeysService.create(dto, req.user.id);
  }

  @Get()
  @Roles(Role.ADMIN, Role.LEAD)
  @ApiOperation({ summary: 'List active API keys for a project' })
  @ApiResponse({ status: 200, description: 'List of API keys (no raw keys)' })
  list(@Param('projectId') projectId: string) {
    return this.apiKeysService.listByProject(projectId);
  }

  @Delete(':keyId')
  @Roles(Role.ADMIN, Role.LEAD)
  @ApiOperation({ summary: 'Revoke an API key' })
  @ApiResponse({ status: 200, description: 'API key revoked' })
  revoke(
    @Param('projectId') projectId: string,
    @Param('keyId') keyId: string,
  ) {
    return this.apiKeysService.revoke(keyId, projectId);
  }
}
