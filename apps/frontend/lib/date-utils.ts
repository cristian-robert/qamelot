export function daysUntil(date: string | null): number | null {
  if (!date) return null;
  const now = new Date();
  const target = new Date(date);
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function isOverdue(date: string | null): boolean {
  if (!date) return false;
  return new Date(date) < new Date();
}
