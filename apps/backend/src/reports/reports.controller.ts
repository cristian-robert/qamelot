import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Role } from '@app/shared';
import { Roles } from '../auth/decorators/roles.decorator';
import { ReportsService } from './reports.service';
import { DateRangeDto } from './dto/date-range.dto';
import { ComparisonQueryDto } from './dto/comparison-query.dto';

@ApiTags('reports')
@Controller()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('projects/:projectId/reports/coverage')
  @Roles(Role.ADMIN, Role.LEAD)
  @ApiOperation({ summary: 'Get test coverage report for a project' })
  @ApiResponse({ status: 200, description: 'Coverage report with status breakdown' })
  @ApiResponse({ status: 403, description: 'Forbidden — requires ADMIN or LEAD role' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  getCoverage(@Param('projectId') projectId: string) {
    return this.reportsService.getCoverage(projectId);
  }

  @Get('projects/:projectId/reports/progress')
  @Roles(Role.ADMIN, Role.LEAD)
  @ApiOperation({ summary: 'Get progress report for a project (per-run counts)' })
  @ApiResponse({ status: 200, description: 'Progress report with per-run status counts' })
  @ApiResponse({ status: 403, description: 'Forbidden — requires ADMIN or LEAD role' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  getProgress(@Param('projectId') projectId: string) {
    return this.reportsService.getProgress(projectId);
  }

  @Get('projects/:projectId/reports/activity')
  @Roles(Role.ADMIN, Role.LEAD)
  @ApiOperation({ summary: 'Get activity report — results per user per day' })
  @ApiResponse({ status: 200, description: 'Activity report with per-user per-day counts' })
  @ApiResponse({ status: 403, description: 'Forbidden — requires ADMIN or LEAD role' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @ApiQuery({ name: 'startDate', required: false, description: 'ISO date filter start' })
  @ApiQuery({ name: 'endDate', required: false, description: 'ISO date filter end' })
  getActivity(
    @Param('projectId') projectId: string,
    @Query() dateRange: DateRangeDto,
  ) {
    return this.reportsService.getActivity(projectId, dateRange);
  }

  @Get('projects/:projectId/reports/reference-coverage')
  @Roles(Role.ADMIN, Role.LEAD)
  @ApiOperation({ summary: 'Get reference coverage report — which requirements/tickets have passing tests' })
  @ApiResponse({ status: 200, description: 'Reference coverage report with per-reference status breakdown' })
  @ApiResponse({ status: 403, description: 'Forbidden — requires ADMIN or LEAD role' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  getReferenceCoverage(@Param('projectId') projectId: string) {
    return this.reportsService.getReferenceCoverage(projectId);
  }

  @Get('projects/:projectId/reports/comparison')
  @Roles(Role.ADMIN, Role.LEAD)
  @ApiOperation({ summary: 'Compare two test runs — show delta (new passes, regressions, etc.)' })
  @ApiResponse({ status: 200, description: 'Comparison report with deltas between two runs' })
  @ApiResponse({ status: 403, description: 'Forbidden — requires ADMIN or LEAD role' })
  @ApiResponse({ status: 404, description: 'Project or run not found' })
  @ApiQuery({ name: 'runIdA', required: true, description: 'Baseline run ID' })
  @ApiQuery({ name: 'runIdB', required: true, description: 'Comparison run ID' })
  getComparison(
    @Param('projectId') projectId: string,
    @Query() query: ComparisonQueryDto,
  ) {
    return this.reportsService.getComparison(projectId, query.runIdA, query.runIdB);
  }

  @Get('projects/:projectId/reports/defect-summary')
  @Roles(Role.ADMIN, Role.LEAD)
  @ApiOperation({ summary: 'Get defect summary — defects by age with linked test results' })
  @ApiResponse({ status: 200, description: 'Defect summary report' })
  @ApiResponse({ status: 403, description: 'Forbidden — requires ADMIN or LEAD role' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @ApiQuery({ name: 'startDate', required: false, description: 'ISO date filter start' })
  @ApiQuery({ name: 'endDate', required: false, description: 'ISO date filter end' })
  getDefectSummary(
    @Param('projectId') projectId: string,
    @Query() dateRange: DateRangeDto,
  ) {
    return this.reportsService.getDefectSummary(projectId, dateRange);
  }

  @Get('projects/:projectId/reports/user-workload')
  @Roles(Role.ADMIN, Role.LEAD)
  @ApiOperation({ summary: 'Get user workload — cases per user with completion rates' })
  @ApiResponse({ status: 200, description: 'User workload report' })
  @ApiResponse({ status: 403, description: 'Forbidden — requires ADMIN or LEAD role' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @ApiQuery({ name: 'startDate', required: false, description: 'ISO date filter start' })
  @ApiQuery({ name: 'endDate', required: false, description: 'ISO date filter end' })
  getUserWorkload(
    @Param('projectId') projectId: string,
    @Query() dateRange: DateRangeDto,
  ) {
    return this.reportsService.getUserWorkload(projectId, dateRange);
  }

  @Get('reports/summary')
  @Roles(Role.ADMIN, Role.LEAD)
  @ApiOperation({ summary: 'Get cross-project dashboard summary' })
  @ApiResponse({ status: 200, description: 'Dashboard summary with totals and recent activity' })
  @ApiResponse({ status: 403, description: 'Forbidden — requires ADMIN or LEAD role' })
  getSummary() {
    return this.reportsService.getSummary();
  }
}
