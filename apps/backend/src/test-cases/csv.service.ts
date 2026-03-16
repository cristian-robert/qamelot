import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { stringify } from 'csv-stringify/sync';
import { parse } from 'csv-parse/sync';
import { CasePriority, CaseType } from '@app/shared';

/** Shape of a test case row ready for CSV export */
export interface CaseCsvRow {
  title: string;
  suite: string;
  priority: string;
  type: string;
  preconditions: string;
  steps: Array<{ description: string; expectedResult: string }>;
}

/** Shape of a parsed import row before validation */
export interface ParsedCaseRow {
  title: string;
  suite: string;
  priority: string;
  type: string;
  preconditions: string;
  steps: Array<{ description: string; expectedResult: string }>;
}

/** Validation error for a single row */
export interface CsvValidationError {
  row: number;
  field: string;
  message: string;
}

/** Result of parsing + validating a CSV import */
export interface CsvParseResult {
  valid: ParsedCaseRow[];
  errors: CsvValidationError[];
}

const VALID_PRIORITIES = new Set(Object.values(CasePriority));
const VALID_TYPES = new Set(Object.values(CaseType));

@Injectable()
export class CsvService {
  private readonly logger = new Logger(CsvService.name);

  /** Generate CSV string from test case rows */
  generateCasesCsv(rows: CaseCsvRow[]): string {
    const maxSteps = rows.reduce(
      (max, r) => Math.max(max, r.steps.length),
      0,
    );

    const headers = ['Title', 'Suite', 'Priority', 'Type', 'Preconditions'];
    for (let i = 1; i <= maxSteps; i++) {
      headers.push(`Step${i}`, `Expected${i}`);
    }

    const records = rows.map((row) => {
      const record: string[] = [
        row.title,
        row.suite,
        row.priority,
        row.type,
        row.preconditions,
      ];
      for (let i = 0; i < maxSteps; i++) {
        const step = row.steps[i];
        record.push(step?.description ?? '', step?.expectedResult ?? '');
      }
      return record;
    });

    return stringify([headers, ...records]);
  }

  /** Generate CSV string from run results */
  generateResultsCsv(
    results: Array<{
      suiteName: string;
      status: string;
      comment: string | null;
      executedBy: string;
      elapsed: number | null;
      createdAt: string;
    }>,
  ): string {
    const headers = [
      'Suite',
      'Status',
      'Comment',
      'Executed By',
      'Elapsed (s)',
      'Date',
    ];

    const records = results.map((r) => [
      r.suiteName,
      r.status,
      r.comment ?? '',
      r.executedBy,
      r.elapsed !== null ? String(r.elapsed) : '',
      r.createdAt,
    ]);

    return stringify([headers, ...records]);
  }

  /** Parse a CSV buffer into validated test case rows */
  parseCasesCsv(buffer: Buffer): CsvParseResult {
    let rawRecords: string[][];
    try {
      rawRecords = parse(buffer, {
        skip_empty_lines: true,
        relax_column_count: true,
      }) as string[][];
    } catch {
      throw new BadRequestException('Invalid CSV format — could not parse file');
    }

    if (rawRecords.length < 2) {
      throw new BadRequestException('CSV must have a header row and at least one data row');
    }

    const headerRow = rawRecords[0].map((h) => h.trim().toLowerCase());
    const titleIdx = headerRow.indexOf('title');
    const suiteIdx = headerRow.indexOf('suite');
    const priorityIdx = headerRow.indexOf('priority');
    const typeIdx = headerRow.indexOf('type');
    const preIdx = headerRow.indexOf('preconditions');

    if (titleIdx === -1) {
      throw new BadRequestException('CSV must have a "Title" column');
    }
    if (suiteIdx === -1) {
      throw new BadRequestException('CSV must have a "Suite" column');
    }

    // Find step columns: Step1, Expected1, Step2, Expected2, ...
    const stepColumns: Array<{ stepIdx: number; expectedIdx: number }> = [];
    for (let i = 1; i <= 50; i++) {
      const si = headerRow.indexOf(`step${i}`);
      const ei = headerRow.indexOf(`expected${i}`);
      if (si !== -1 && ei !== -1) {
        stepColumns.push({ stepIdx: si, expectedIdx: ei });
      } else {
        break;
      }
    }

    const valid: ParsedCaseRow[] = [];
    const errors: CsvValidationError[] = [];

    for (let rowNum = 1; rowNum < rawRecords.length; rowNum++) {
      const cols = rawRecords[rowNum];
      const csvRow = rowNum + 1; // human-readable row number (1-based, accounting for header)

      const title = cols[titleIdx]?.trim() ?? '';
      const suite = cols[suiteIdx]?.trim() ?? '';
      const priority = (cols[priorityIdx]?.trim() ?? 'MEDIUM').toUpperCase();
      const type = (cols[typeIdx]?.trim() ?? 'FUNCTIONAL').toUpperCase();
      const preconditions = preIdx !== -1 ? (cols[preIdx]?.trim() ?? '') : '';

      let hasError = false;

      if (!title) {
        errors.push({ row: csvRow, field: 'Title', message: 'Title is required' });
        hasError = true;
      }
      if (title.length > 300) {
        errors.push({ row: csvRow, field: 'Title', message: 'Title must be 300 characters or less' });
        hasError = true;
      }
      if (!suite) {
        errors.push({ row: csvRow, field: 'Suite', message: 'Suite is required' });
        hasError = true;
      }
      if (!VALID_PRIORITIES.has(priority as CasePriority)) {
        errors.push({
          row: csvRow,
          field: 'Priority',
          message: `Invalid priority "${priority}". Must be one of: ${[...VALID_PRIORITIES].join(', ')}`,
        });
        hasError = true;
      }
      if (!VALID_TYPES.has(type as CaseType)) {
        errors.push({
          row: csvRow,
          field: 'Type',
          message: `Invalid type "${type}". Must be one of: ${[...VALID_TYPES].join(', ')}`,
        });
        hasError = true;
      }

      if (hasError) continue;

      const steps: Array<{ description: string; expectedResult: string }> = [];
      for (const sc of stepColumns) {
        const desc = cols[sc.stepIdx]?.trim() ?? '';
        const exp = cols[sc.expectedIdx]?.trim() ?? '';
        if (desc || exp) {
          steps.push({ description: desc, expectedResult: exp });
        }
      }

      valid.push({ title, suite, priority, type, preconditions, steps });
    }

    this.logger.log(
      `CSV parsed: ${valid.length} valid rows, ${errors.length} errors`,
    );

    return { valid, errors };
  }
}
