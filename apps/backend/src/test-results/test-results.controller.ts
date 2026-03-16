import {
  Controller,
  Get,
  Post,
  Patch,
  Sse,
  Body,
  Param,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Observable, map, merge, interval } from 'rxjs';
import { Role } from '@app/shared';
import type { RunProgressEvent } from '@app/shared';
import { Roles } from '../auth/decorators/roles.decorator';
import { TestResultsService } from './test-results.service';
import { RunEventsService } from '../run-events/run-events.service';
import { SubmitTestResultDto } from './dto/submit-test-result.dto';
import { UpdateTestResultDto } from './dto/update-test-result.dto';

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

  @Post('runs/:runId/results')
  @Roles(Role.ADMIN, Role.LEAD, Role.TESTER)
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
  @Roles(Role.ADMIN, Role.LEAD, Role.TESTER)
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
