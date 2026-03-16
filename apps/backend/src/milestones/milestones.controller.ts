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
import { MilestonesService } from './milestones.service';
import { CreateMilestoneDto } from './dto/create-milestone.dto';
import { UpdateMilestoneDto } from './dto/update-milestone.dto';

@ApiTags('milestones')
@Controller()
export class MilestonesController {
  constructor(private readonly milestonesService: MilestonesService) {}

  @Post('projects/:projectId/milestones')
  @Roles(Role.ADMIN, Role.LEAD)
  @ApiOperation({ summary: 'Create a milestone for a project' })
  @ApiResponse({ status: 201, description: 'Milestone created' })
  @ApiResponse({ status: 403, description: 'Forbidden — requires ADMIN or LEAD role' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateMilestoneDto,
  ) {
    return this.milestonesService.create(projectId, dto);
  }

  @Get('projects/:projectId/milestones')
  @ApiOperation({ summary: 'List all milestones for a project' })
  @ApiResponse({ status: 200, description: 'Array of milestones' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @ApiQuery({ name: 'status', required: false, enum: ['OPEN', 'CLOSED'] })
  findAll(
    @Param('projectId') projectId: string,
    @Query('status') status?: string,
  ) {
    return this.milestonesService.findAllByProject(projectId, { status });
  }

  @Get('projects/:projectId/milestones/tree')
  @ApiOperation({ summary: 'Get milestone tree with progress aggregation' })
  @ApiResponse({ status: 200, description: 'Milestone tree with nested children and progress' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  findTree(@Param('projectId') projectId: string) {
    return this.milestonesService.findTreeByProject(projectId);
  }

  @Get('milestones/:id')
  @ApiOperation({ summary: 'Get a milestone by ID' })
  @ApiResponse({ status: 200, description: 'The milestone' })
  @ApiResponse({ status: 404, description: 'Milestone not found' })
  findOne(@Param('id') id: string) {
    return this.milestonesService.findOne(id);
  }

  @Patch('milestones/:id')
  @Roles(Role.ADMIN, Role.LEAD)
  @ApiOperation({ summary: 'Update / close a milestone' })
  @ApiResponse({ status: 200, description: 'Milestone updated' })
  @ApiResponse({ status: 403, description: 'Forbidden — requires ADMIN or LEAD role' })
  @ApiResponse({ status: 404, description: 'Milestone not found' })
  update(@Param('id') id: string, @Body() dto: UpdateMilestoneDto) {
    return this.milestonesService.update(id, dto);
  }

  @Delete('milestones/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Archive (soft delete) a milestone' })
  @ApiResponse({ status: 200, description: 'Milestone archived' })
  @ApiResponse({ status: 403, description: 'Forbidden — requires ADMIN role' })
  @ApiResponse({ status: 404, description: 'Milestone not found' })
  remove(@Param('id') id: string) {
    return this.milestonesService.softDelete(id);
  }
}
