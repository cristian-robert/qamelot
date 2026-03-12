import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CaseList } from './CaseList';
import { TestCasePriority, TestCaseType, type TestCaseDto } from '@app/shared';

const mockCase: TestCaseDto = {
  id: 'case-1',
  title: 'Verify login with valid credentials',
  preconditions: null,
  steps: [{ action: 'Click', expected: 'OK' }],
  priority: TestCasePriority.HIGH,
  type: TestCaseType.FUNCTIONAL,
  automationFlag: false,
  suiteId: 'suite-1',
  projectId: 'proj-1',
  deletedAt: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
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
});
