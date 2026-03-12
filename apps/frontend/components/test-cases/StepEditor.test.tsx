import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StepEditor } from './StepEditor';
import type { TestCaseStep } from '@app/shared';

describe('StepEditor', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders existing steps', () => {
    const steps: TestCaseStep[] = [
      { action: 'Click login', expected: 'Form appears' },
    ];
    render(<StepEditor steps={steps} onChange={mockOnChange} />);

    expect(screen.getByDisplayValue('Click login')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Form appears')).toBeInTheDocument();
  });

  it('adds a new empty step when add button is clicked', async () => {
    const user = userEvent.setup();
    render(<StepEditor steps={[]} onChange={mockOnChange} />);

    await user.click(screen.getByRole('button', { name: /add step/i }));

    expect(mockOnChange).toHaveBeenCalledWith([{ action: '', expected: '' }]);
  });

  it('removes a step when remove button is clicked', async () => {
    const user = userEvent.setup();
    const steps: TestCaseStep[] = [
      { action: 'Step 1', expected: 'Result 1' },
      { action: 'Step 2', expected: 'Result 2' },
    ];
    render(<StepEditor steps={steps} onChange={mockOnChange} />);

    const removeButtons = screen.getAllByRole('button', { name: /remove step/i });
    await user.click(removeButtons[0]);

    expect(mockOnChange).toHaveBeenCalledWith([{ action: 'Step 2', expected: 'Result 2' }]);
  });

  it('renders step numbers', () => {
    const steps: TestCaseStep[] = [
      { action: 'Step A', expected: 'Result A' },
      { action: 'Step B', expected: 'Result B' },
    ];
    render(<StepEditor steps={steps} onChange={mockOnChange} />);

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('moves a step up', async () => {
    const user = userEvent.setup();
    const steps: TestCaseStep[] = [
      { action: 'First', expected: 'R1' },
      { action: 'Second', expected: 'R2' },
    ];
    render(<StepEditor steps={steps} onChange={mockOnChange} />);

    const moveUpButtons = screen.getAllByRole('button', { name: /move up/i });
    await user.click(moveUpButtons[1]);

    expect(mockOnChange).toHaveBeenCalledWith([
      { action: 'Second', expected: 'R2' },
      { action: 'First', expected: 'R1' },
    ]);
  });

  it('moves a step down', async () => {
    const user = userEvent.setup();
    const steps: TestCaseStep[] = [
      { action: 'First', expected: 'R1' },
      { action: 'Second', expected: 'R2' },
    ];
    render(<StepEditor steps={steps} onChange={mockOnChange} />);

    const moveDownButtons = screen.getAllByRole('button', { name: /move down/i });
    await user.click(moveDownButtons[0]);

    expect(mockOnChange).toHaveBeenCalledWith([
      { action: 'Second', expected: 'R2' },
      { action: 'First', expected: 'R1' },
    ]);
  });
});
