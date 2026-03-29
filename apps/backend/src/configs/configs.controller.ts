import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Permission } from '@app/shared';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { ConfigsService } from './configs.service';
import { CreateConfigGroupDto } from './dto/create-config-group.dto';
import { UpdateConfigGroupDto } from './dto/update-config-group.dto';
import { CreateConfigItemDto } from './dto/create-config-item.dto';
import { UpdateConfigItemDto } from './dto/update-config-item.dto';

@ApiTags('configs')
@Controller()
export class ConfigsController {
  constructor(private readonly configsService: ConfigsService) {}

  // ── Config Groups ──

  @Post('projects/:projectId/configs')
  @RequirePermission(Permission.MANAGE_CONFIGS)
  @ApiOperation({ summary: 'Create a config group for a project' })
  @ApiResponse({ status: 201, description: 'Config group created' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  createGroup(
    @Param('projectId') projectId: string,
    @Body() dto: CreateConfigGroupDto,
  ) {
    return this.configsService.createGroup(projectId, dto);
  }

  @Get('projects/:projectId/configs')
  @ApiOperation({ summary: 'List all config groups with items for a project' })
  @ApiResponse({ status: 200, description: 'Array of config groups with items' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  findAllGroups(@Param('projectId') projectId: string) {
    return this.configsService.findAllGroups(projectId);
  }

  @Get('configs/:id')
  @ApiOperation({ summary: 'Get a single config group with items' })
  @ApiResponse({ status: 200, description: 'Config group detail' })
  @ApiResponse({ status: 404, description: 'Config group not found' })
  findOneGroup(@Param('id') id: string) {
    return this.configsService.findOneGroup(id);
  }

  @Patch('configs/:id')
  @RequirePermission(Permission.MANAGE_CONFIGS)
  @ApiOperation({ summary: 'Update a config group' })
  @ApiResponse({ status: 200, description: 'Config group updated' })
  @ApiResponse({ status: 404, description: 'Config group not found' })
  updateGroup(
    @Param('id') id: string,
    @Body() dto: UpdateConfigGroupDto,
  ) {
    return this.configsService.updateGroup(id, dto);
  }

  @Delete('configs/:id')
  @RequirePermission(Permission.MANAGE_CONFIGS)
  @ApiOperation({ summary: 'Archive (soft delete) a config group' })
  @ApiResponse({ status: 200, description: 'Config group archived' })
  @ApiResponse({ status: 404, description: 'Config group not found' })
  removeGroup(@Param('id') id: string) {
    return this.configsService.softDeleteGroup(id);
  }

  // ── Config Items ──

  @Post('configs/:groupId/items')
  @RequirePermission(Permission.MANAGE_CONFIGS)
  @ApiOperation({ summary: 'Create a config item in a group' })
  @ApiResponse({ status: 201, description: 'Config item created' })
  @ApiResponse({ status: 404, description: 'Config group not found' })
  createItem(
    @Param('groupId') groupId: string,
    @Body() dto: CreateConfigItemDto,
  ) {
    return this.configsService.createItem(groupId, dto);
  }

  @Patch('config-items/:id')
  @RequirePermission(Permission.MANAGE_CONFIGS)
  @ApiOperation({ summary: 'Update a config item' })
  @ApiResponse({ status: 200, description: 'Config item updated' })
  @ApiResponse({ status: 404, description: 'Config item not found' })
  updateItem(
    @Param('id') id: string,
    @Body() dto: UpdateConfigItemDto,
  ) {
    return this.configsService.updateItem(id, dto);
  }

  @Delete('config-items/:id')
  @RequirePermission(Permission.MANAGE_CONFIGS)
  @ApiOperation({ summary: 'Archive (soft delete) a config item' })
  @ApiResponse({ status: 200, description: 'Config item archived' })
  @ApiResponse({ status: 404, description: 'Config item not found' })
  removeItem(@Param('id') id: string) {
    return this.configsService.softDeleteItem(id);
  }
}
