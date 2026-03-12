import { describe, it, expect } from 'vitest';
import { buildTree } from './tree-utils';
import type { TestSuiteDto } from '@app/shared';

const makeSuite = (overrides: Partial<TestSuiteDto>): TestSuiteDto => ({
  id: 'id-1',
  projectId: 'proj-1',
  name: 'Suite',
  description: null,
  parentId: null,
  deletedAt: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

describe('buildTree', () => {
  it('returns empty array for empty input', () => {
    expect(buildTree([])).toEqual([]);
  });

  it('returns root nodes with empty children', () => {
    const suites = [makeSuite({ id: 'a', name: 'A' })];
    const tree = buildTree(suites);

    expect(tree).toHaveLength(1);
    expect(tree[0].id).toBe('a');
    expect(tree[0].children).toEqual([]);
  });

  it('nests children under their parent', () => {
    const suites = [
      makeSuite({ id: 'parent', name: 'Parent' }),
      makeSuite({ id: 'child', name: 'Child', parentId: 'parent' }),
    ];
    const tree = buildTree(suites);

    expect(tree).toHaveLength(1);
    expect(tree[0].children).toHaveLength(1);
    expect(tree[0].children[0].id).toBe('child');
  });

  it('handles multiple levels of nesting', () => {
    const suites = [
      makeSuite({ id: 'root', name: 'Root' }),
      makeSuite({ id: 'mid', name: 'Mid', parentId: 'root' }),
      makeSuite({ id: 'leaf', name: 'Leaf', parentId: 'mid' }),
    ];
    const tree = buildTree(suites);

    expect(tree).toHaveLength(1);
    expect(tree[0].children[0].children[0].id).toBe('leaf');
  });

  it('sorts siblings alphabetically by name', () => {
    const suites = [
      makeSuite({ id: 'b', name: 'Bravo' }),
      makeSuite({ id: 'a', name: 'Alpha' }),
      makeSuite({ id: 'c', name: 'Charlie' }),
    ];
    const tree = buildTree(suites);

    expect(tree.map((n) => n.name)).toEqual(['Alpha', 'Bravo', 'Charlie']);
  });

  it('handles multiple root nodes', () => {
    const suites = [
      makeSuite({ id: 'a', name: 'A' }),
      makeSuite({ id: 'b', name: 'B' }),
    ];
    const tree = buildTree(suites);

    expect(tree).toHaveLength(2);
  });
});
