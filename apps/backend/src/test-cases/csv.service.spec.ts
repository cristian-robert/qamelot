import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CsvService } from './csv.service';
import type { CaseCsvRow } from './csv.service';

describe('CsvService', () => {
  let service: CsvService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CsvService],
    }).compile();
    service = module.get<CsvService>(CsvService);
  });

  // ── generateCasesCsv ──

  describe('generateCasesCsv', () => {
    it('generates CSV with headers and rows', () => {
      const rows: CaseCsvRow[] = [
        {
          title: 'Login test',
          suite: 'Auth',
          priority: 'HIGH',
          type: 'FUNCTIONAL',
          preconditions: 'User exists',
          steps: [
            { description: 'Enter email', expectedResult: 'Email accepted' },
            { description: 'Click login', expectedResult: 'User logged in' },
          ],
        },
      ];

      const csv = service.generateCasesCsv(rows);
      const lines = csv.trim().split('\n');

      expect(lines[0]).toContain('Title');
      expect(lines[0]).toContain('Suite');
      expect(lines[0]).toContain('Priority');
      expect(lines[0]).toContain('Step1');
      expect(lines[0]).toContain('Expected1');
      expect(lines[0]).toContain('Step2');
      expect(lines[0]).toContain('Expected2');
      expect(lines[1]).toContain('Login test');
      expect(lines[1]).toContain('Auth');
      expect(lines[1]).toContain('HIGH');
      expect(lines[1]).toContain('Enter email');
    });

    it('handles cases with no steps', () => {
      const rows: CaseCsvRow[] = [
        {
          title: 'Simple case',
          suite: 'Basic',
          priority: 'LOW',
          type: 'OTHER',
          preconditions: '',
          steps: [],
        },
      ];

      const csv = service.generateCasesCsv(rows);
      const lines = csv.trim().split('\n');

      expect(lines[0]).toBe('Title,Suite,Priority,Type,Preconditions');
      expect(lines[1]).toContain('Simple case');
    });

    it('pads shorter step arrays to match max steps', () => {
      const rows: CaseCsvRow[] = [
        {
          title: 'Case A',
          suite: 'S1',
          priority: 'MEDIUM',
          type: 'FUNCTIONAL',
          preconditions: '',
          steps: [{ description: 'Step 1', expectedResult: 'Expected 1' }],
        },
        {
          title: 'Case B',
          suite: 'S1',
          priority: 'MEDIUM',
          type: 'FUNCTIONAL',
          preconditions: '',
          steps: [
            { description: 'Step 1', expectedResult: 'Expected 1' },
            { description: 'Step 2', expectedResult: 'Expected 2' },
          ],
        },
      ];

      const csv = service.generateCasesCsv(rows);
      const lines = csv.trim().split('\n');

      // Header should have Step1, Expected1, Step2, Expected2
      expect(lines[0]).toContain('Step2');
      expect(lines[0]).toContain('Expected2');
    });

    it('returns empty csv with only headers when no rows', () => {
      const csv = service.generateCasesCsv([]);
      const lines = csv.trim().split('\n');

      expect(lines).toHaveLength(1);
      expect(lines[0]).toContain('Title');
    });
  });

  // ── generateResultsCsv ──

  describe('generateResultsCsv', () => {
    it('generates results CSV with correct columns', () => {
      const results = [
        {
          suiteName: 'Auth Suite',
          status: 'PASSED',
          comment: 'All good',
          executedBy: 'Jane Doe',
          elapsed: 120,
          createdAt: '2026-03-16T10:00:00Z',
        },
      ];

      const csv = service.generateResultsCsv(results);
      const lines = csv.trim().split('\n');

      expect(lines[0]).toContain('Suite');
      expect(lines[0]).toContain('Status');
      expect(lines[0]).toContain('Comment');
      expect(lines[0]).toContain('Executed By');
      expect(lines[0]).toContain('Elapsed (s)');
      expect(lines[0]).toContain('Date');
      expect(lines[1]).toContain('PASSED');
      expect(lines[1]).toContain('Jane Doe');
    });

    it('handles null comment and elapsed', () => {
      const results = [
        {
          suiteName: 'Suite',
          status: 'FAILED',
          comment: null,
          executedBy: 'User',
          elapsed: null,
          createdAt: '2026-03-16T10:00:00Z',
        },
      ];

      const csv = service.generateResultsCsv(results);
      expect(csv).toContain('FAILED');
    });
  });

  // ── parseCasesCsv ──

  describe('parseCasesCsv', () => {
    it('parses a valid CSV buffer', () => {
      const csvContent =
        'Title,Suite,Priority,Type,Preconditions,Step1,Expected1\n' +
        'Login test,Auth,HIGH,FUNCTIONAL,User exists,Enter email,Email accepted\n' +
        'Logout test,Auth,MEDIUM,FUNCTIONAL,,Click logout,User logged out\n';

      const result = service.parseCasesCsv(Buffer.from(csvContent));

      expect(result.errors).toHaveLength(0);
      expect(result.valid).toHaveLength(2);
      expect(result.valid[0].title).toBe('Login test');
      expect(result.valid[0].suite).toBe('Auth');
      expect(result.valid[0].priority).toBe('HIGH');
      expect(result.valid[0].steps).toHaveLength(1);
      expect(result.valid[0].steps[0].description).toBe('Enter email');
      expect(result.valid[0].steps[0].expectedResult).toBe('Email accepted');
    });

    it('defaults priority to MEDIUM and type to FUNCTIONAL when omitted', () => {
      const csvContent =
        'Title,Suite\n' +
        'Simple case,Basic\n';

      const result = service.parseCasesCsv(Buffer.from(csvContent));

      expect(result.valid).toHaveLength(1);
      expect(result.valid[0].priority).toBe('MEDIUM');
      expect(result.valid[0].type).toBe('FUNCTIONAL');
    });

    it('returns errors for rows with missing title', () => {
      const csvContent =
        'Title,Suite,Priority,Type\n' +
        ',Auth,HIGH,FUNCTIONAL\n';

      const result = service.parseCasesCsv(Buffer.from(csvContent));

      expect(result.valid).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('Title');
      expect(result.errors[0].row).toBe(2);
    });

    it('returns errors for rows with missing suite', () => {
      const csvContent =
        'Title,Suite\n' +
        'Test case,\n';

      const result = service.parseCasesCsv(Buffer.from(csvContent));

      expect(result.valid).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('Suite');
    });

    it('returns errors for invalid priority', () => {
      const csvContent =
        'Title,Suite,Priority\n' +
        'Test,Auth,INVALID\n';

      const result = service.parseCasesCsv(Buffer.from(csvContent));

      expect(result.valid).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('Priority');
    });

    it('returns errors for invalid type', () => {
      const csvContent =
        'Title,Suite,Priority,Type\n' +
        'Test,Auth,HIGH,INVALID\n';

      const result = service.parseCasesCsv(Buffer.from(csvContent));

      expect(result.valid).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('Type');
    });

    it('throws BadRequestException when CSV has no Title column', () => {
      const csvContent = 'Name,Suite\nTest,Auth\n';

      expect(() => service.parseCasesCsv(Buffer.from(csvContent))).toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException when CSV has no Suite column', () => {
      const csvContent = 'Title,Category\nTest,Auth\n';

      expect(() => service.parseCasesCsv(Buffer.from(csvContent))).toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException for empty CSV', () => {
      expect(() => service.parseCasesCsv(Buffer.from(''))).toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException for header-only CSV', () => {
      const csvContent = 'Title,Suite\n';

      expect(() => service.parseCasesCsv(Buffer.from(csvContent))).toThrow(
        BadRequestException,
      );
    });

    it('handles case-insensitive header matching', () => {
      const csvContent =
        'title,SUITE,Priority,TYPE,preconditions\n' +
        'Test case,Auth Suite,HIGH,SMOKE,\n';

      const result = service.parseCasesCsv(Buffer.from(csvContent));

      expect(result.valid).toHaveLength(1);
      expect(result.valid[0].title).toBe('Test case');
      expect(result.valid[0].suite).toBe('Auth Suite');
      expect(result.valid[0].type).toBe('SMOKE');
    });

    it('parses multiple step columns', () => {
      const csvContent =
        'Title,Suite,Step1,Expected1,Step2,Expected2,Step3,Expected3\n' +
        'Multi-step,Auth,Open page,Page loads,Click login,Form appears,Submit,Dashboard shown\n';

      const result = service.parseCasesCsv(Buffer.from(csvContent));

      expect(result.valid).toHaveLength(1);
      expect(result.valid[0].steps).toHaveLength(3);
      expect(result.valid[0].steps[2].description).toBe('Submit');
      expect(result.valid[0].steps[2].expectedResult).toBe('Dashboard shown');
    });

    it('handles priority case-insensitively', () => {
      const csvContent =
        'Title,Suite,Priority\n' +
        'Test,Auth,high\n';

      const result = service.parseCasesCsv(Buffer.from(csvContent));

      expect(result.valid).toHaveLength(1);
      expect(result.valid[0].priority).toBe('HIGH');
    });

    it('returns mix of valid rows and errors', () => {
      const csvContent =
        'Title,Suite,Priority\n' +
        'Good case,Auth,HIGH\n' +
        ',Auth,HIGH\n' +
        'Another good,Basic,MEDIUM\n';

      const result = service.parseCasesCsv(Buffer.from(csvContent));

      expect(result.valid).toHaveLength(2);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].row).toBe(3);
    });
  });
});
