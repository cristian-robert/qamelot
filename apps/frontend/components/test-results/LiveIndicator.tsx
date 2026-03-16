import type { SSEConnectionStatus } from '@/lib/test-results/useRunSSE';

interface LiveIndicatorProps {
  status: SSEConnectionStatus;
}

const statusConfig: Record<SSEConnectionStatus, { label: string; dotClass: string; textClass: string }> = {
  connected: {
    label: 'Live',
    dotClass: 'bg-green-500 animate-pulse',
    textClass: 'text-green-700',
  },
  connecting: {
    label: 'Connecting',
    dotClass: 'bg-yellow-500 animate-pulse',
    textClass: 'text-yellow-700',
  },
  disconnected: {
    label: 'Offline',
    dotClass: 'bg-gray-400',
    textClass: 'text-gray-500',
  },
};

export function LiveIndicator({ status }: LiveIndicatorProps) {
  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-1.5" role="status" aria-label={`Connection: ${config.label}`}>
      <span className={`inline-block h-2 w-2 rounded-full ${config.dotClass}`} />
      <span className={`text-xs font-medium ${config.textClass}`}>{config.label}</span>
    </div>
  );
}
