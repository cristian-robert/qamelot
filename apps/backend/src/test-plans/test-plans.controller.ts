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
import { Permission } from '@app/shared';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { TestPlansService } from './test-plans.service';
import { CreateTestPlanDto } from './dto/create-test-plan.dto';
import { UpdateTestPlanDto } from './dto/update-test-plan.dto';

@ApiTags('test-plans')
@Controller('projects/:projectId/plans')
export class TestPlansController {
  constructor(private readonly testPlansService: TestPlansService) {}

  @Post()
  @RequirePermission(Permission.MANAGE_PLANS)
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
  @ApiResponse({ status: 200, description: 'Paginated list of test plans' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @ApiQuery({ name: 'status', required: false, enum: ['DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  findAll(
    @Param('projectId') projectId: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.testPlansService.findAllByProject(projectId, {
      status,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
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
  @RequirePermission(Permission.MANAGE_PLANS)
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
  @RequirePermission(Permission.MANAGE_PLANS)
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
