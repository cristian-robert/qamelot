/**
 * Compute the cartesian product of multiple arrays.
 * cartesian([[a, b], [x, y]]) => [[a, x], [a, y], [b, x], [b, y]]
 */
export function cartesian<T>(arrays: T[][]): T[][] {
  if (arrays.length === 0) return [];
  if (arrays.some((arr) => arr.length === 0)) return [];

  return arrays.reduce<T[][]>(
    (acc, curr) => acc.flatMap((combo) => curr.map((item) => [...combo, item])),
    [[]],
  );
}
