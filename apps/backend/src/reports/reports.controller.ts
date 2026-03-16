import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Role } from '@app/shared';
import { Roles } from '../auth/decorators/roles.decorator';
import { ReportsService } from './reports.service';

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
  @ApiOperation({ summary: 'Get activity report — results per user per day (last 30 days)' })
  @ApiResponse({ status: 200, description: 'Activity report with per-user per-day counts' })
  @ApiResponse({ status: 403, description: 'Forbidden — requires ADMIN or LEAD role' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  getActivity(@Param('projectId') projectId: string) {
    return this.reportsService.getActivity(projectId);
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
