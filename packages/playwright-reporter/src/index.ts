import { QamelotReporter } from './reporter';

export { QamelotReporter } from './reporter';
export { QamelotClient } from './client';
export type { QamelotReporterConfig, AutomationResult } from './types';

// Default export for Playwright config: reporter: [['@app/playwright-reporter', { ... }]]
export default QamelotReporter;
