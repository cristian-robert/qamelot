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
import { Role } from '@app/shared';
import { Roles } from '../auth/decorators/roles.decorator';
import { SharedStepsService } from './shared-steps.service';
import { CreateSharedStepDto } from './dto/create-shared-step.dto';
import { UpdateSharedStepDto } from './dto/update-shared-step.dto';

@ApiTags('shared-steps')
@Controller('projects/:projectId/shared-steps')
export class SharedStepsController {
  constructor(private readonly sharedStepsService: SharedStepsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.LEAD, Role.TESTER)
  @ApiOperation({ summary: 'Create a shared step in a project' })
  @ApiResponse({ status: 201, description: 'Shared step created' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateSharedStepDto,
  ) {
    return this.sharedStepsService.create(projectId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all shared steps in a project' })
  @ApiResponse({ status: 200, description: 'Paginated list of shared steps with items' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  findAll(
    @Param('projectId') projectId: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.sharedStepsService.findAllByProject(projectId, {
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single shared step' })
  @ApiResponse({ status: 200, description: 'Shared step with items' })
  @ApiResponse({ status: 404, description: 'Shared step not found' })
  findOne(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    return this.sharedStepsService.findOne(projectId, id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.LEAD, Role.TESTER)
  @ApiOperation({ summary: 'Update a shared step' })
  @ApiResponse({ status: 200, description: 'Shared step updated' })
  @ApiResponse({ status: 404, description: 'Shared step not found' })
  update(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() dto: UpdateSharedStepDto,
  ) {
    return this.sharedStepsService.update(projectId, id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.LEAD)
  @ApiOperation({ summary: 'Soft-delete a shared step' })
  @ApiResponse({ status: 200, description: 'Shared step deleted' })
  @ApiResponse({ status: 404, description: 'Shared step not found' })
  remove(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    return this.sharedStepsService.softDelete(projectId, id);
  }
}
