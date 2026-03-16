import { describe, it, expect } from 'vitest';
import { downloadCsv } from './csv-export';

describe('csv-export', () => {
  it('downloadCsv is a function', () => {
    expect(typeof downloadCsv).toBe('function');
  });
});
