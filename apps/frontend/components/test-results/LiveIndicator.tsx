export function LiveIndicator() {
  return (
    <span className="flex items-center gap-1.5 text-xs font-medium text-status-passed">
      <span className="size-2 rounded-full bg-status-passed animate-pulse-dot" />
      Live
    </span>
  );
}
