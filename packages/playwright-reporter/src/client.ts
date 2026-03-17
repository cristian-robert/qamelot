import type {
  QamelotReporterConfig,
  CreateRunResponse,
  SubmitResultsResponse,
  AutomationResult,
} from './types';

export class QamelotClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly timeout: number;

  constructor(config: QamelotReporterConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.apiKey = config.apiKey;
    this.timeout = config.timeout ?? 30_000;
  }

  async createRun(data: {
    projectId: string;
    planId: string;
    name: string;
    automationIds: string[];
    ciJobUrl?: string;
  }): Promise<CreateRunResponse> {
    return this.post<CreateRunResponse>('/automation/runs', data);
  }

  async submitResults(
    runId: string,
    results: AutomationResult[],
  ): Promise<SubmitResultsResponse> {
    return this.post<SubmitResultsResponse>(
      `/automation/runs/${runId}/results`,
      { results },
    );
  }

  async completeRun(runId: string): Promise<void> {
    await this.post(`/automation/runs/${runId}/complete`, {});
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);

    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Qamelot API ${res.status}: ${text}`);
      }

      return (await res.json()) as T;
    } finally {
      clearTimeout(timer);
    }
  }
}
