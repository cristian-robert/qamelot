export function LiveIndicator() {
  return (
    <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
      <span className="size-2 rounded-full bg-emerald-500 animate-pulse-dot" />
      Live
    </span>
  );
}
