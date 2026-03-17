import type {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
  TestResult,
} from '@playwright/test/reporter';
import { QamelotClient } from './client';
import type { QamelotReporterConfig, AutomationResult } from './types';

export class QamelotReporter implements Reporter {
  private client: QamelotClient;
  private config: QamelotReporterConfig;
  private runId: string | null = null;
  private resultBuffer: AutomationResult[] = [];
  private automationIds: string[] = [];
  private flushPromise: Promise<void> = Promise.resolve();
  private readonly BATCH_SIZE = 50;

  constructor(config: QamelotReporterConfig) {
    this.config = config;
    this.client = new QamelotClient(config);
  }

  onBegin(_config: FullConfig, suite: Suite): void {
    this.automationIds = this.collectTestIds(suite);
    if (this.automationIds.length === 0) {
      console.warn('[qamelot] No tests found to report');
      return;
    }

    const runName =
      this.config.runName ??
      `Playwright Run ${new Date().toISOString().slice(0, 19)}`;

    this.flushPromise = this.client
      .createRun({
        projectId: this.config.projectId,
        planId: this.config.planId,
        name: runName,
        automationIds: this.automationIds,
        ciJobUrl: this.config.ciJobUrl,
      })
      .then((run) => {
        this.runId = run.id;
        if (run.unmatchedIds.length > 0) {
          console.warn(
            `[qamelot] ${run.unmatchedIds.length} test(s) not linked in Qamelot`,
          );
        }
        console.log(
          `[qamelot] Run created: ${run.id} (${this.automationIds.length} tests)`,
        );
      })
      .catch((err: Error) => {
        console.error(`[qamelot] Failed to create run: ${err.message}`);
      });
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    // Only report the final retry attempt
    if (result.retry > 0 && result.status !== 'passed') {
      return;
    }

    const automationId = this.buildTestId(test);
    const mappedStatus = this.mapStatus(result.status);

    this.resultBuffer.push({
      automationId,
      status: mappedStatus,
      duration: result.duration,
      error: result.error?.message,
      log: result.error?.stack,
    });

    if (this.resultBuffer.length >= this.BATCH_SIZE) {
      this.flush();
    }
  }

  async onEnd(_result: FullResult): Promise<void> {
    await this.flushPromise;

    if (!this.runId) {
      console.error('[qamelot] No run ID — skipping result submission');
      return;
    }

    await this.flush();
    await this.flushPromise;

    try {
      await this.client.completeRun(this.runId);
      console.log(`[qamelot] Run ${this.runId} completed`);
    } catch (err) {
      console.error(
        `[qamelot] Failed to complete run: ${(err as Error).message}`,
      );
    }
  }

  private flush(): void {
    if (this.resultBuffer.length === 0 || !this.runId) return;
    const batch = this.resultBuffer.splice(0, this.resultBuffer.length);
    const runId = this.runId;

    this.flushPromise = this.flushPromise
      .then(() => this.client.submitResults(runId, batch))
      .then((res) => {
        if (res.submitted < res.total) {
          console.warn(
            `[qamelot] ${res.total - res.submitted} result(s) had no matching case`,
          );
        }
      })
      .catch((err: Error) => {
        console.error(`[qamelot] Failed to submit results: ${err.message}`);
      });
  }

  private collectTestIds(suite: Suite): string[] {
    const ids: string[] = [];
    for (const test of suite.allTests()) {
      ids.push(this.buildTestId(test));
    }
    return ids;
  }

  private buildTestId(test: TestCase): string {
    // Prefer explicit @QAM: tag — no path nonsense
    const qamTag = test.tags.find((t) => t.startsWith('@QAM:'));
    if (qamTag) {
      return qamTag.slice(5); // strip "@QAM:" prefix
    }

    // Fallback: build from file path + title path
    const filePath = test.location.file;
    const titlePath = test.titlePath().filter(
      (s) => s.length > 0 && !s.endsWith('.spec.ts') && !s.endsWith('.test.ts'),
    );
    return `${filePath} > ${titlePath.join(' > ')}`;
  }

  private mapStatus(
    status: 'passed' | 'failed' | 'timedOut' | 'skipped' | 'interrupted',
  ): 'PASSED' | 'FAILED' | 'BLOCKED' {
    switch (status) {
      case 'passed':
        return 'PASSED';
      case 'failed':
      case 'timedOut':
      case 'interrupted':
        return 'FAILED';
      case 'skipped':
        return 'BLOCKED';
    }
  }
}
