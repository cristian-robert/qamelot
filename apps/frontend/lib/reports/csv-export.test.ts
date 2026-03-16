import { describe, it, expect, vi, beforeEach } from 'vitest';
import { downloadCsv } from './csv-export';

describe('downloadCsv', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('creates a blob with CSV content and triggers download', () => {
    const clickSpy = vi.fn();

    // jsdom doesn't implement URL.createObjectURL/revokeObjectURL
    globalThis.URL.createObjectURL = vi.fn().mockReturnValue('blob:test');
    globalThis.URL.revokeObjectURL = vi.fn();

    vi.spyOn(document, 'createElement').mockReturnValue({
      href: '',
      download: '',
      click: clickSpy,
    } as unknown as HTMLAnchorElement);

    downloadCsv('test.csv', ['Name', 'Count'], [['Alice', '10'], ['Bob', '20']]);

    expect(globalThis.URL.createObjectURL).toHaveBeenCalledOnce();
    expect(clickSpy).toHaveBeenCalledOnce();
    expect(globalThis.URL.revokeObjectURL).toHaveBeenCalledWith('blob:test');
  });

  it('sets the correct download filename', () => {
    let capturedDownload = '';
    const clickSpy = vi.fn();

    globalThis.URL.createObjectURL = vi.fn().mockReturnValue('blob:test');
    globalThis.URL.revokeObjectURL = vi.fn();

    vi.spyOn(document, 'createElement').mockReturnValue({
      set href(_: string) { /* noop */ },
      get href() { return ''; },
      set download(val: string) { capturedDownload = val; },
      get download() { return capturedDownload; },
      click: clickSpy,
    } as unknown as HTMLAnchorElement);

    downloadCsv('my-report.csv', ['Col'], [['val']]);

    expect(capturedDownload).toBe('my-report.csv');
  });
});
