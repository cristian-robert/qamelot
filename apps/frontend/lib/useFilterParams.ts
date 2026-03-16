'use client';

import { useCallback, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

/**
 * Manages filter state via URL search parameters so filters are
 * shareable and bookmarkable. Returns current filter values and
 * helpers to set/clear them.
 */
export function useFilterParams<K extends string>(keys: readonly K[]) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const filters = useMemo(() => {
    const result: Partial<Record<K, string>> = {};
    for (const key of keys) {
      const value = searchParams.get(key);
      if (value) {
        result[key] = value;
      }
    }
    return result;
  }, [searchParams, keys]);

  const activeCount = useMemo(
    () => Object.keys(filters).length,
    [filters],
  );

  const setFilter = useCallback(
    (key: string, value: string | undefined) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      const qs = params.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false });
    },
    [searchParams, router, pathname],
  );

  const clearAll = useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [router, pathname]);

  return { filters, activeCount, setFilter, clearAll };
}
