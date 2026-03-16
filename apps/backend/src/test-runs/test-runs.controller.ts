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
  @ApiResponse({ status: 404, description: 'Plan or suites not found' })
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
  findAllByPlan(@Param('planId') planId: string) {
    return this.testRunsService.findAllByPlan(planId);
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

  @Delete('runs/:id')
  @Roles(Role.ADMIN, Role.LEAD)
  @ApiOperation({ summary: 'Archive (soft delete) a test run' })
  @ApiResponse({ status: 200, description: 'Test run archived' })
  @ApiResponse({ status: 404, description: 'Test run not found' })
  remove(@Param('id') id: string) {
    return this.testRunsService.softDelete(id);
  }
}
