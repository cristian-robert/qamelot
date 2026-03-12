import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CaseEditor } from './CaseEditor';
import type { TestCaseDto } from '@app/shared';

describe('CaseEditor', () => {
  const mockOnSave = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty form for new case', () => {
    render(<CaseEditor onSave={mockOnSave} onCancel={mockOnCancel} isPending={false} />);

    expect(screen.getByLabelText(/title/i)).toHaveValue('');
    expect(screen.getByLabelText(/preconditions/i)).toHaveValue('');
  });

  it('renders form pre-filled when editing existing case', () => {
    const testCase: TestCaseDto = {
      id: 'case-1',
      title: 'Verify login',
      preconditions: 'User exists',
      steps: [{ action: 'Click', expected: 'OK' }],
      priority: 'HIGH',
      type: 'REGRESSION',
      automationFlag: true,
      suiteId: 'suite-1',
      projectId: 'proj-1',
      deletedAt: null,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };
    render(
      <CaseEditor
        testCase={testCase}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        isPending={false}
      />,
    );

    expect(screen.getByLabelText(/title/i)).toHaveValue('Verify login');
    expect(screen.getByLabelText(/preconditions/i)).toHaveValue('User exists');
  });

  it('calls onSave with form data on submit', async () => {
    const user = userEvent.setup();
    render(<CaseEditor onSave={mockOnSave} onCancel={mockOnCancel} isPending={false} />);

    await user.type(screen.getByLabelText(/title/i), 'New test case');
    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(mockOnSave).toHaveBeenCalledTimes(1);
    const savedData = mockOnSave.mock.calls[0][0];
    expect(savedData.title).toBe('New test case');
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<CaseEditor onSave={mockOnSave} onCancel={mockOnCancel} isPending={false} />);

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('disables save button when isPending is true', () => {
    render(<CaseEditor onSave={mockOnSave} onCancel={mockOnCancel} isPending={true} />);

    expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
  });

  it('shows validation error when title is empty on submit', async () => {
    const user = userEvent.setup();
    render(<CaseEditor onSave={mockOnSave} onCancel={mockOnCancel} isPending={false} />);

    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(mockOnSave).not.toHaveBeenCalled();
    expect(screen.getByText(/title is required/i)).toBeInTheDocument();
  });
});
