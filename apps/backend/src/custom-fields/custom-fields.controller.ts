import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Role, CustomFieldEntityType } from '@app/shared';
import { Roles } from '../auth/decorators/roles.decorator';
import { CustomFieldsService } from './custom-fields.service';
import { CreateCustomFieldDefinitionDto } from './dto/create-custom-field-definition.dto';
import { UpdateCustomFieldDefinitionDto } from './dto/update-custom-field-definition.dto';
import { SetCustomFieldValuesDto } from './dto/set-custom-field-values.dto';

@ApiTags('custom-fields')
@Controller('projects/:projectId/custom-fields')
export class CustomFieldsController {
  constructor(private readonly customFieldsService: CustomFieldsService) {}

  // ── Definition CRUD ──

  @Post('definitions')
  @Roles(Role.ADMIN, Role.LEAD)
  @ApiOperation({ summary: 'Create a custom field definition' })
  @ApiResponse({ status: 201, description: 'Custom field definition created' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  createDefinition(
    @Param('projectId') projectId: string,
    @Body() dto: CreateCustomFieldDefinitionDto,
  ) {
    return this.customFieldsService.createDefinition(projectId, dto);
  }

  @Get('definitions')
  @ApiOperation({ summary: 'List custom field definitions for a project' })
  @ApiResponse({ status: 200, description: 'Array of custom field definitions' })
  @ApiQuery({
    name: 'entityType',
    required: false,
    enum: CustomFieldEntityType,
    description: 'Filter by entity type',
  })
  findDefinitions(
    @Param('projectId') projectId: string,
    @Query('entityType') entityType?: CustomFieldEntityType,
  ) {
    return this.customFieldsService.findDefinitions(projectId, entityType);
  }

  @Get('definitions/:definitionId')
  @ApiOperation({ summary: 'Get a single custom field definition' })
  @ApiResponse({ status: 200, description: 'Custom field definition' })
  @ApiResponse({ status: 404, description: 'Definition not found' })
  findDefinition(
    @Param('projectId') projectId: string,
    @Param('definitionId') definitionId: string,
  ) {
    return this.customFieldsService.findDefinition(projectId, definitionId);
  }

  @Patch('definitions/:definitionId')
  @Roles(Role.ADMIN, Role.LEAD)
  @ApiOperation({ summary: 'Update a custom field definition' })
  @ApiResponse({ status: 200, description: 'Custom field definition updated' })
  @ApiResponse({ status: 404, description: 'Definition not found' })
  updateDefinition(
    @Param('projectId') projectId: string,
    @Param('definitionId') definitionId: string,
    @Body() dto: UpdateCustomFieldDefinitionDto,
  ) {
    return this.customFieldsService.updateDefinition(projectId, definitionId, dto);
  }

  @Delete('definitions/:definitionId')
  @Roles(Role.ADMIN, Role.LEAD)
  @ApiOperation({ summary: 'Soft-delete a custom field definition' })
  @ApiResponse({ status: 200, description: 'Custom field definition deleted' })
  @ApiResponse({ status: 404, description: 'Definition not found' })
  deleteDefinition(
    @Param('projectId') projectId: string,
    @Param('definitionId') definitionId: string,
  ) {
    return this.customFieldsService.deleteDefinition(projectId, definitionId);
  }

  // ── Values ──

  @Get('values/:entityType/:entityId')
  @ApiOperation({ summary: 'Get custom field values for an entity' })
  @ApiResponse({ status: 200, description: 'Array of custom field values with definitions' })
  getValues(
    @Param('entityType') entityType: CustomFieldEntityType,
    @Param('entityId') entityId: string,
  ) {
    return this.customFieldsService.getValues(entityType, entityId);
  }

  @Post('values/:entityType/:entityId')
  @Roles(Role.ADMIN, Role.LEAD, Role.TESTER)
  @ApiOperation({ summary: 'Set custom field values for an entity' })
  @ApiResponse({ status: 201, description: 'Custom field values saved' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  setValues(
    @Param('entityType') entityType: CustomFieldEntityType,
    @Param('entityId') entityId: string,
    @Body() dto: SetCustomFieldValuesDto,
  ) {
    return this.customFieldsService.setValues(entityType, entityId, dto);
  }

  // ── Search ──

  @Get('search')
  @ApiOperation({ summary: 'Search entities by custom field value' })
  @ApiResponse({ status: 200, description: 'Array of entity IDs matching the search' })
  @ApiQuery({ name: 'definitionId', required: true, type: String })
  @ApiQuery({ name: 'value', required: true, type: String })
  searchByFieldValue(
    @Param('projectId') projectId: string,
    @Query('definitionId') definitionId: string,
    @Query('value') value: string,
  ) {
    return this.customFieldsService.searchByFieldValue(projectId, definitionId, value);
  }
}
