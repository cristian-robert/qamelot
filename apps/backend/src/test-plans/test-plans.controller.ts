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
import { TestPlansService } from './test-plans.service';
import { CreateTestPlanDto } from './dto/create-test-plan.dto';
import { UpdateTestPlanDto } from './dto/update-test-plan.dto';

@ApiTags('test-plans')
@Controller('projects/:projectId/plans')
export class TestPlansController {
  constructor(private readonly testPlansService: TestPlansService) {}

  @Post()
  @Roles(Role.ADMIN, Role.LEAD)
  @ApiOperation({ summary: 'Create a test plan' })
  @ApiResponse({ status: 201, description: 'Test plan created' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateTestPlanDto,
  ) {
    return this.testPlansService.create(projectId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all test plans for a project' })
  @ApiResponse({ status: 200, description: 'Array of test plans' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @ApiQuery({ name: 'status', required: false, enum: ['DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED'] })
  findAll(
    @Param('projectId') projectId: string,
    @Query('status') status?: string,
  ) {
    return this.testPlansService.findAllByProject(projectId, { status });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a test plan by ID' })
  @ApiResponse({ status: 200, description: 'The test plan' })
  @ApiResponse({ status: 404, description: 'Test plan not found' })
  findOne(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    return this.testPlansService.findOne(projectId, id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.LEAD)
  @ApiOperation({ summary: 'Update a test plan' })
  @ApiResponse({ status: 200, description: 'Test plan updated' })
  @ApiResponse({ status: 404, description: 'Test plan not found' })
  update(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTestPlanDto,
  ) {
    return this.testPlansService.update(projectId, id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.LEAD)
  @ApiOperation({ summary: 'Archive (soft delete) a test plan' })
  @ApiResponse({ status: 200, description: 'Test plan archived' })
  @ApiResponse({ status: 404, description: 'Test plan not found' })
  remove(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    return this.testPlansService.softDelete(projectId, id);
  }
}
