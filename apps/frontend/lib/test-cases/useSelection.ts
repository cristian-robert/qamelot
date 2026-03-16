'use client';

import { useState, useCallback, useRef } from 'react';

export function useSelection(itemIds: string[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const lastClickedRef = useRef<string | null>(null);

  const toggle = useCallback(
    (id: string, shiftKey: boolean) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);

        if (shiftKey && lastClickedRef.current && lastClickedRef.current !== id) {
          const lastIndex = itemIds.indexOf(lastClickedRef.current);
          const currentIndex = itemIds.indexOf(id);
          if (lastIndex !== -1 && currentIndex !== -1) {
            const start = Math.min(lastIndex, currentIndex);
            const end = Math.max(lastIndex, currentIndex);
            for (let i = start; i <= end; i++) {
              next.add(itemIds[i]);
            }
            lastClickedRef.current = id;
            return next;
          }
        }

        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        lastClickedRef.current = id;
        return next;
      });
    },
    [itemIds],
  );

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(itemIds));
  }, [itemIds]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
    lastClickedRef.current = null;
  }, []);

  const isAllSelected = itemIds.length > 0 && selectedIds.size === itemIds.length;
  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < itemIds.length;

  const toggleAll = useCallback(() => {
    if (isAllSelected) {
      deselectAll();
    } else {
      selectAll();
    }
  }, [isAllSelected, deselectAll, selectAll]);

  return {
    selectedIds,
    toggle,
    selectAll,
    deselectAll,
    toggleAll,
    isAllSelected,
    isSomeSelected,
    selectedCount: selectedIds.size,
  };
}
