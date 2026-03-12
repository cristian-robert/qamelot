import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SuiteTree } from './SuiteTree';
import type { TreeNode } from '@/lib/test-suites/tree-utils';

const makeNode = (overrides: Partial<TreeNode>): TreeNode => ({
  id: 'id-1',
  projectId: 'proj-1',
  name: 'Suite',
  description: null,
  parentId: null,
  deletedAt: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  children: [],
  ...overrides,
});

describe('SuiteTree', () => {
  const mockOnCreate = vi.fn();
  const mockOnRename = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => vi.clearAllMocks());

  it('renders suite names', () => {
    const tree = [
      makeNode({ id: 'a', name: 'Alpha' }),
      makeNode({ id: 'b', name: 'Bravo' }),
    ];

    render(
      <SuiteTree
        tree={tree}
        onCreateChild={mockOnCreate}
        onRename={mockOnRename}
        onDelete={mockOnDelete}
      />,
    );

    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Bravo')).toBeInTheDocument();
  });

  it('renders nested children', () => {
    const tree = [
      makeNode({
        id: 'parent',
        name: 'Parent',
        children: [makeNode({ id: 'child', name: 'Child', parentId: 'parent' })],
      }),
    ];

    render(
      <SuiteTree
        tree={tree}
        onCreateChild={mockOnCreate}
        onRename={mockOnRename}
        onDelete={mockOnDelete}
      />,
    );

    expect(screen.getByText('Parent')).toBeInTheDocument();
    expect(screen.getByText('Child')).toBeInTheDocument();
  });

  it('toggles children visibility on click', async () => {
    const user = userEvent.setup();
    const tree = [
      makeNode({
        id: 'parent',
        name: 'Parent',
        children: [makeNode({ id: 'child', name: 'Child', parentId: 'parent' })],
      }),
    ];

    render(
      <SuiteTree
        tree={tree}
        onCreateChild={mockOnCreate}
        onRename={mockOnRename}
        onDelete={mockOnDelete}
      />,
    );

    expect(screen.getByText('Child')).toBeInTheDocument();

    const toggle = screen.getByRole('button', { name: /toggle parent/i });
    await user.click(toggle);

    expect(screen.queryByText('Child')).not.toBeInTheDocument();
  });

  it('shows empty state when tree is empty', () => {
    render(
      <SuiteTree
        tree={[]}
        onCreateChild={mockOnCreate}
        onRename={mockOnRename}
        onDelete={mockOnDelete}
      />,
    );

    expect(screen.getByText(/no suites/i)).toBeInTheDocument();
  });
});
