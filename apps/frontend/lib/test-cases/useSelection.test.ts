import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSelection } from './useSelection';

describe('useSelection', () => {
  const itemIds = ['a', 'b', 'c', 'd', 'e'];

  it('starts with empty selection', () => {
    const { result } = renderHook(() => useSelection(itemIds));

    expect(result.current.selectedCount).toBe(0);
    expect(result.current.isAllSelected).toBe(false);
    expect(result.current.isSomeSelected).toBe(false);
  });

  it('toggles a single item on', () => {
    const { result } = renderHook(() => useSelection(itemIds));

    act(() => {
      result.current.toggle('b', false);
    });

    expect(result.current.selectedIds.has('b')).toBe(true);
    expect(result.current.selectedCount).toBe(1);
    expect(result.current.isSomeSelected).toBe(true);
    expect(result.current.isAllSelected).toBe(false);
  });

  it('toggles a single item off', () => {
    const { result } = renderHook(() => useSelection(itemIds));

    act(() => {
      result.current.toggle('b', false);
    });
    act(() => {
      result.current.toggle('b', false);
    });

    expect(result.current.selectedIds.has('b')).toBe(false);
    expect(result.current.selectedCount).toBe(0);
  });

  it('selects all items', () => {
    const { result } = renderHook(() => useSelection(itemIds));

    act(() => {
      result.current.selectAll();
    });

    expect(result.current.selectedCount).toBe(5);
    expect(result.current.isAllSelected).toBe(true);
    expect(result.current.isSomeSelected).toBe(false);
  });

  it('deselects all items', () => {
    const { result } = renderHook(() => useSelection(itemIds));

    act(() => {
      result.current.selectAll();
    });
    act(() => {
      result.current.deselectAll();
    });

    expect(result.current.selectedCount).toBe(0);
    expect(result.current.isAllSelected).toBe(false);
  });

  it('toggleAll selects all when none selected', () => {
    const { result } = renderHook(() => useSelection(itemIds));

    act(() => {
      result.current.toggleAll();
    });

    expect(result.current.isAllSelected).toBe(true);
    expect(result.current.selectedCount).toBe(5);
  });

  it('toggleAll deselects all when all selected', () => {
    const { result } = renderHook(() => useSelection(itemIds));

    act(() => {
      result.current.selectAll();
    });
    act(() => {
      result.current.toggleAll();
    });

    expect(result.current.selectedCount).toBe(0);
    expect(result.current.isAllSelected).toBe(false);
  });

  it('shift-click selects a range', () => {
    const { result } = renderHook(() => useSelection(itemIds));

    // Click 'b' first (no shift)
    act(() => {
      result.current.toggle('b', false);
    });

    // Shift-click 'd' to select range b-d
    act(() => {
      result.current.toggle('d', true);
    });

    expect(result.current.selectedIds.has('b')).toBe(true);
    expect(result.current.selectedIds.has('c')).toBe(true);
    expect(result.current.selectedIds.has('d')).toBe(true);
    expect(result.current.selectedIds.has('a')).toBe(false);
    expect(result.current.selectedIds.has('e')).toBe(false);
    expect(result.current.selectedCount).toBe(3);
  });

  it('returns empty set for empty itemIds', () => {
    const { result } = renderHook(() => useSelection([]));

    expect(result.current.selectedCount).toBe(0);
    expect(result.current.isAllSelected).toBe(false);
    expect(result.current.isSomeSelected).toBe(false);
  });
});
