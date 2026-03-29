import {
  Controller,
  Get,
  Post,
  Patch,
  Sse,
  Body,
  Param,
  Request,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { Observable, map, merge, interval } from 'rxjs';
import { Permission } from '@app/shared';
import type { RunProgressEvent } from '@app/shared';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { TestResultsService } from './test-results.service';
import { RunEventsService } from '../run-events/run-events.service';
import { SubmitTestResultDto } from './dto/submit-test-result.dto';
import { UpdateTestResultDto } from './dto/update-test-result.dto';
import { BulkSubmitResultsDto } from './dto/bulk-submit-results.dto';

interface AuthenticatedRequest {
  user: { id: string; email: string; role: string };
}

@ApiTags('test-results')
@Controller()
export class TestResultsController {
  constructor(
    private readonly testResultsService: TestResultsService,
    private readonly runEventsService: RunEventsService,
  ) {}

  @Post('runs/:runId/results/bulk')
  @RequirePermission(Permission.SUBMIT_RESULTS)
  @ApiOperation({ summary: 'Bulk submit results for multiple cases in a run' })
  @ApiResponse({ status: 201, description: 'Results submitted with count' })
  @ApiResponse({ status: 400, description: 'One or more cases do not belong to this run' })
  @ApiResponse({ status: 404, description: 'Run not found' })
  bulkSubmit(
    @Param('runId') runId: string,
    @Body() dto: BulkSubmitResultsDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.testResultsService.bulkSubmit(runId, req.user.id, dto);
  }

  @Post('runs/:runId/results')
  @RequirePermission(Permission.SUBMIT_RESULTS)
  @ApiOperation({ summary: 'Submit a test result for a case in a run' })
  @ApiResponse({ status: 201, description: 'Result submitted' })
  @ApiResponse({ status: 400, description: 'Case does not belong to this run' })
  @ApiResponse({ status: 404, description: 'Run not found' })
  submit(
    @Param('runId') runId: string,
    @Body() dto: SubmitTestResultDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.testResultsService.submit(runId, req.user.id, dto);
  }

  @Get('runs/:runId/results')
  @ApiOperation({ summary: 'List all results for a run' })
  @ApiResponse({ status: 200, description: 'Array of test results' })
  @ApiResponse({ status: 404, description: 'Run not found' })
  findAllByRun(@Param('runId') runId: string) {
    return this.testResultsService.findAllByRun(runId);
  }

  @Get('runs/:runId/execution')
  @ApiOperation({ summary: 'Get run with cases, latest results, and summary' })
  @ApiResponse({ status: 200, description: 'Run execution detail with summary' })
  @ApiResponse({ status: 404, description: 'Run not found' })
  getExecution(@Param('runId') runId: string) {
    return this.testResultsService.getRunWithSummary(runId);
  }

  @Get('runs/:runId/results/export')
  @ApiOperation({ summary: 'Export run results as CSV' })
  @ApiResponse({ status: 200, description: 'CSV file download' })
  @ApiResponse({ status: 404, description: 'Run not found' })
  @ApiQuery({ name: 'format', required: false, enum: ['csv'] })
  async exportResults(
    @Param('runId') runId: string,
    @Res() res: Response,
  ) {
    const csv = await this.testResultsService.exportResultsCsv(runId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="run-results-${runId}.csv"`,
    );
    res.send(csv);
  }

  @Sse('runs/:runId/stream')
  @ApiOperation({ summary: 'SSE stream of real-time result updates for a run' })
  @ApiResponse({ status: 200, description: 'SSE event stream' })
  stream(
    @Param('runId') runId: string,
  ): Observable<MessageEvent<RunProgressEvent | string>> {
    const HEARTBEAT_MS = 30_000;

    const heartbeat$ = interval(HEARTBEAT_MS).pipe(
      map(() => ({ data: 'heartbeat' }) as MessageEvent<string>),
    );

    const events$ = this.runEventsService.getStream(runId);

    return merge(events$, heartbeat$);
  }

  @Patch('results/:id')
  @RequirePermission(Permission.SUBMIT_RESULTS)
  @ApiOperation({ summary: 'Update a test result (change status, comment, elapsed)' })
  @ApiResponse({ status: 200, description: 'Result updated' })
  @ApiResponse({ status: 404, description: 'Result not found' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTestResultDto,
  ) {
    return this.testResultsService.update(id, dto);
  }
}
