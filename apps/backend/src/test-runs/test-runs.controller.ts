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
import { TestRunsService } from './test-runs.service';
import { CreateTestRunDto } from './dto/create-test-run.dto';
import { UpdateTestRunDto } from './dto/update-test-run.dto';

@ApiTags('test-runs')
@Controller()
export class TestRunsController {
  constructor(private readonly testRunsService: TestRunsService) {}

  @Post('plans/:planId/runs')
  @Roles(Role.ADMIN, Role.LEAD, Role.TESTER)
  @ApiOperation({ summary: 'Create a test run under a plan' })
  @ApiResponse({ status: 201, description: 'Test run created' })
  @ApiResponse({ status: 404, description: 'Plan or cases not found' })
  create(
    @Param('planId') planId: string,
    @Body() dto: CreateTestRunDto,
  ) {
    return this.testRunsService.create(planId, dto);
  }

  @Get('plans/:planId/runs')
  @ApiOperation({ summary: 'List all test runs for a plan' })
  @ApiResponse({ status: 200, description: 'Array of test runs' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'] })
  @ApiQuery({ name: 'assigneeId', required: false })
  findAllByPlan(
    @Param('planId') planId: string,
    @Query('status') status?: string,
    @Query('assigneeId') assigneeId?: string,
  ) {
    return this.testRunsService.findAllByPlan(planId, { status, assigneeId });
  }

  @Get('runs/:id')
  @ApiOperation({ summary: 'Get a test run detail with all cases' })
  @ApiResponse({ status: 200, description: 'Test run detail' })
  @ApiResponse({ status: 404, description: 'Test run not found' })
  findOne(@Param('id') id: string) {
    return this.testRunsService.findOne(id);
  }

  @Patch('runs/:id')
  @Roles(Role.ADMIN, Role.LEAD, Role.TESTER)
  @ApiOperation({ summary: 'Update a test run' })
  @ApiResponse({ status: 200, description: 'Test run updated' })
  @ApiResponse({ status: 404, description: 'Test run not found' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTestRunDto,
  ) {
    return this.testRunsService.update(id, dto);
  }

  @Patch('runs/:id/close')
  @Roles(Role.ADMIN, Role.LEAD, Role.TESTER)
  @ApiOperation({ summary: 'Close a test run — marks it as COMPLETED and freezes results' })
  @ApiResponse({ status: 200, description: 'Test run closed' })
  @ApiResponse({ status: 404, description: 'Test run not found' })
  @ApiResponse({ status: 409, description: 'Run is already closed' })
  close(@Param('id') id: string) {
    return this.testRunsService.closeRun(id);
  }

  @Post('runs/:id/rerun')
  @Roles(Role.ADMIN, Role.LEAD, Role.TESTER)
  @ApiOperation({ summary: 'Create a rerun from a completed run with failed/untested cases' })
  @ApiResponse({ status: 201, description: 'Rerun created' })
  @ApiResponse({ status: 400, description: 'Run is not completed or no cases to rerun' })
  @ApiResponse({ status: 404, description: 'Source run not found' })
  rerun(@Param('id') id: string) {
    return this.testRunsService.rerun(id);
  }

  @Delete('runs/:id')
  @Roles(Role.ADMIN, Role.LEAD)
  @ApiOperation({ summary: 'Archive (soft delete) a test run' })
  @ApiResponse({ status: 200, description: 'Test run archived' })
  @ApiResponse({ status: 404, description: 'Test run not found' })
  remove(@Param('id') id: string) {
    return this.testRunsService.softDelete(id);
  }
}
