'use client';

import { useCallback, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

export function useFilterParams() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const params = useMemo(() => Object.fromEntries(searchParams.entries()), [searchParams]);

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(searchParams.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      router.replace(`${pathname}?${next.toString()}`);
    },
    [searchParams, router, pathname],
  );

  const clearAll = useCallback(() => {
    router.replace(pathname);
  }, [router, pathname]);

  return { params, setParam, clearAll };
}
