'use client';

import { useState, useEffect } from 'react';

/**
 * Returns a debounced version of the provided value.
 * Updates only after the specified delay (ms) of inactivity.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debouncedValue;
}
