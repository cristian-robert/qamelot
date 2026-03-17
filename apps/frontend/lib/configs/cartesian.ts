import type { ConfigGroupWithItemsDto } from '@app/shared';

export interface CartesianEntry {
  label: string;
  items: Array<{ groupId: string; itemId: string; name: string }>;
}

export function cartesianProduct(groups: ConfigGroupWithItemsDto[]): CartesianEntry[] {
  if (groups.length === 0) return [];
  const result: CartesianEntry[] = [];

  function recurse(index: number, current: CartesianEntry['items'], labels: string[]) {
    if (index === groups.length) {
      result.push({ label: labels.join(' / '), items: [...current] });
      return;
    }
    const group = groups[index];
    for (const item of group.items) {
      recurse(
        index + 1,
        [...current, { groupId: group.id, itemId: item.id, name: item.name }],
        [...labels, item.name],
      );
    }
  }

  recurse(0, [], []);
  return result;
}
