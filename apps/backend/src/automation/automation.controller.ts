import { Controller, Post, Get, Body, Param, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { ApiKeyAuth } from '../auth/decorators/api-key-auth.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { AutomationService } from './automation.service';
import { CreateAutomationRunDto } from './dto/create-automation-run.dto';
import {
  BulkSubmitAutomationResultsDto,
  SyncAutomationTestsDto,
} from './dto/submit-automation-result.dto';
import { SetupAutomationProjectDto } from './dto/setup-automation-project.dto';
import { Role } from '@app/shared';

@ApiTags('automation')
@Controller('automation')
export class AutomationController {
  constructor(private readonly automationService: AutomationService) {}

  @Post('runs')
  @ApiKeyAuth()
  @ApiHeader({ name: 'X-API-Key', required: true, description: 'Project API key' })
  @ApiOperation({ summary: 'Create an automated test run' })
  @ApiResponse({ status: 201, description: 'Automated run created' })
  createRun(
    @Body() dto: CreateAutomationRunDto,
    @Req() req: { apiKey: { id: string; projectId: string } },
  ) {
    return this.automationService.createRun(dto, req.apiKey.projectId);
  }

  @Post('runs/:runId/results')
  @ApiKeyAuth()
  @ApiHeader({ name: 'X-API-Key', required: true, description: 'Project API key' })
  @ApiOperation({ summary: 'Submit automation results in bulk' })
  @ApiResponse({ status: 201, description: 'Results submitted' })
  async submitResults(
    @Param('runId') runId: string,
    @Body() dto: BulkSubmitAutomationResultsDto,
    @Req() req: { apiKey: { id: string; projectId: string } },
  ) {
    let submitted = 0;
    for (const result of dto.results) {
      const saved = await this.automationService.submitResult(
        runId,
        result,
        req.apiKey.projectId,
        req.apiKey.id,
      );
      if (saved) submitted++;
    }
    return { submitted, total: dto.results.length };
  }

  @Post('runs/:runId/complete')
  @ApiKeyAuth()
  @ApiHeader({ name: 'X-API-Key', required: true, description: 'Project API key' })
  @ApiOperation({ summary: 'Mark automated run as completed' })
  @ApiResponse({ status: 200, description: 'Run marked complete' })
  completeRun(
    @Param('runId') runId: string,
    @Req() req: { apiKey: { id: string; projectId: string } },
  ) {
    return this.automationService.completeRun(runId, req.apiKey.projectId);
  }

  @Get('cases/:projectId')
  @ApiKeyAuth()
  @ApiHeader({ name: 'X-API-Key', required: true, description: 'Project API key' })
  @ApiOperation({ summary: 'List test cases with automation IDs' })
  @ApiResponse({ status: 200, description: 'List of automated case mappings' })
  listCases(
    @Param('projectId') projectId: string,
  ) {
    return this.automationService.listAutomatedCases(projectId);
  }

  @Post('sync')
  @ApiKeyAuth()
  @ApiHeader({ name: 'X-API-Key', required: true, description: 'Project API key' })
  @ApiOperation({ summary: 'Sync Playwright test discovery with Qamelot cases' })
  @ApiResponse({ status: 200, description: 'Sync results' })
  sync(
    @Body() dto: SyncAutomationTestsDto,
  ) {
    return this.automationService.syncTests(dto.projectId, dto.tests);
  }

  @Post('setup')
  @Roles(Role.ADMIN, Role.LEAD)
  @ApiOperation({ summary: 'Idempotent project+plan setup for automation' })
  @ApiResponse({ status: 201, description: 'Project and plan IDs returned' })
  setup(@Body() dto: SetupAutomationProjectDto) {
    return this.automationService.setupProject(dto);
  }
}
