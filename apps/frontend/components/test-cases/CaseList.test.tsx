import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CaseList } from './CaseList';
import { CasePriority, CaseType, TemplateType, type TestCaseDto } from '@app/shared';

const mockCase: TestCaseDto = {
  id: 'case-1',
  title: 'Verify login with valid credentials',
  preconditions: null,
  templateType: TemplateType.TEXT,
  priority: CasePriority.HIGH,
  type: CaseType.FUNCTIONAL,
  estimate: null,
  references: null,
  position: 0,
  suiteId: 'suite-1',
  projectId: 'proj-1',
  deletedAt: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const mockCase2: TestCaseDto = {
  ...mockCase,
  id: 'case-2',
  title: 'Verify logout',
  position: 1,
};

describe('CaseList', () => {
  const mockOnSelect = vi.fn();
  const mockOnCreate = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders case titles', () => {
    render(
      <CaseList
        cases={[mockCase]}
        selectedId={null}
        onSelect={mockOnSelect}
        onCreate={mockOnCreate}
        onDelete={mockOnDelete}
      />,
    );

    expect(screen.getByText('Verify login with valid credentials')).toBeInTheDocument();
  });

  it('shows priority badge', () => {
    render(
      <CaseList
        cases={[mockCase]}
        selectedId={null}
        onSelect={mockOnSelect}
        onCreate={mockOnCreate}
        onDelete={mockOnDelete}
      />,
    );

    expect(screen.getByText('High')).toBeInTheDocument();
  });

  it('calls onSelect when a case is clicked', async () => {
    const user = userEvent.setup();
    render(
      <CaseList
        cases={[mockCase]}
        selectedId={null}
        onSelect={mockOnSelect}
        onCreate={mockOnCreate}
        onDelete={mockOnDelete}
      />,
    );

    await user.click(screen.getByText('Verify login with valid credentials'));

    expect(mockOnSelect).toHaveBeenCalledWith('case-1');
  });

  it('highlights the selected case', () => {
    render(
      <CaseList
        cases={[mockCase]}
        selectedId="case-1"
        onSelect={mockOnSelect}
        onCreate={mockOnCreate}
        onDelete={mockOnDelete}
      />,
    );

    const item = screen.getByText('Verify login with valid credentials').closest('[data-selected]');
    expect(item).toHaveAttribute('data-selected', 'true');
  });

  it('shows empty state when no cases', () => {
    render(
      <CaseList
        cases={[]}
        selectedId={null}
        onSelect={mockOnSelect}
        onCreate={mockOnCreate}
        onDelete={mockOnDelete}
      />,
    );

    expect(screen.getByText(/no test cases/i)).toBeInTheDocument();
  });

  it('calls onCreate when new case button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <CaseList
        cases={[]}
        selectedId={null}
        onSelect={mockOnSelect}
        onCreate={mockOnCreate}
        onDelete={mockOnDelete}
      />,
    );

    await user.click(screen.getByRole('button', { name: /new case/i }));

    expect(mockOnCreate).toHaveBeenCalledTimes(1);
  });

  it('calls onDelete when delete button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <CaseList
        cases={[mockCase]}
        selectedId={null}
        onSelect={mockOnSelect}
        onCreate={mockOnCreate}
        onDelete={mockOnDelete}
      />,
    );

    await user.click(screen.getByRole('button', { name: /delete verify login/i }));

    expect(mockOnDelete).toHaveBeenCalledWith('case-1');
    expect(mockOnSelect).not.toHaveBeenCalled();
  });

  // ── Selection / Checkbox tests ──

  it('renders checkboxes when onToggleSelect is provided', () => {
    render(
      <CaseList
        cases={[mockCase]}
        selectedId={null}
        onSelect={mockOnSelect}
        onCreate={mockOnCreate}
        onDelete={mockOnDelete}
        selectedIds={new Set()}
        onToggleSelect={vi.fn()}
        onToggleAll={vi.fn()}
        isAllSelected={false}
        isSomeSelected={false}
      />,
    );

    expect(screen.getByLabelText('Select all test cases')).toBeInTheDocument();
    expect(screen.getByLabelText(/select verify login/i)).toBeInTheDocument();
  });

  it('does not render checkboxes without onToggleSelect', () => {
    render(
      <CaseList
        cases={[mockCase]}
        selectedId={null}
        onSelect={mockOnSelect}
        onCreate={mockOnCreate}
        onDelete={mockOnDelete}
      />,
    );

    expect(screen.queryByLabelText('Select all test cases')).not.toBeInTheDocument();
  });

  it('calls onToggleSelect when case checkbox is clicked', async () => {
    const user = userEvent.setup();
    const mockToggle = vi.fn();
    render(
      <CaseList
        cases={[mockCase]}
        selectedId={null}
        onSelect={mockOnSelect}
        onCreate={mockOnCreate}
        onDelete={mockOnDelete}
        selectedIds={new Set()}
        onToggleSelect={mockToggle}
        onToggleAll={vi.fn()}
        isAllSelected={false}
        isSomeSelected={false}
      />,
    );

    await user.click(screen.getByLabelText(/select verify login/i));

    expect(mockToggle).toHaveBeenCalledWith('case-1', false);
  });

  it('calls onToggleAll when select all checkbox is clicked', async () => {
    const user = userEvent.setup();
    const mockToggleAll = vi.fn();
    render(
      <CaseList
        cases={[mockCase, mockCase2]}
        selectedId={null}
        onSelect={mockOnSelect}
        onCreate={mockOnCreate}
        onDelete={mockOnDelete}
        selectedIds={new Set()}
        onToggleSelect={vi.fn()}
        onToggleAll={mockToggleAll}
        isAllSelected={false}
        isSomeSelected={false}
      />,
    );

    await user.click(screen.getByLabelText('Select all test cases'));

    expect(mockToggleAll).toHaveBeenCalledTimes(1);
  });

  it('applies selected highlight to checked cases', () => {
    render(
      <CaseList
        cases={[mockCase]}
        selectedId={null}
        onSelect={mockOnSelect}
        onCreate={mockOnCreate}
        onDelete={mockOnDelete}
        selectedIds={new Set(['case-1'])}
        onToggleSelect={vi.fn()}
        onToggleAll={vi.fn()}
        isAllSelected={true}
        isSomeSelected={false}
      />,
    );

    const checkbox = screen.getByLabelText(/select verify login/i) as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });
});
