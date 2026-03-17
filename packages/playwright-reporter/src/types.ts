export interface QamelotReporterConfig {
  /** Qamelot backend URL, e.g. http://localhost:5002 */
  baseUrl: string;
  /** API key (starts with qam_) */
  apiKey: string;
  /** Qamelot project ID */
  projectId: string;
  /** Qamelot test plan ID */
  planId: string;
  /** Optional run name — defaults to "Playwright Run <timestamp>" */
  runName?: string;
  /** Optional CI job URL */
  ciJobUrl?: string;
  /** Request timeout in ms — defaults to 30000 */
  timeout?: number;
}

export interface CreateRunResponse {
  id: string;
  name: string;
  executionType: string;
  unmatchedIds: string[];
}

export interface SubmitResultsResponse {
  submitted: number;
  total: number;
}

export interface AutomationResult {
  automationId: string;
  status: 'PASSED' | 'FAILED' | 'BLOCKED';
  duration?: number;
  error?: string;
  log?: string;
}
