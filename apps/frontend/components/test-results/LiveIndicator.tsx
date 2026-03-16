import { cn } from '@/lib/utils';
import type { SSEConnectionStatus } from '@/lib/test-results/useRunSSE';

interface LiveIndicatorProps {
  status: SSEConnectionStatus;
}

const statusConfig: Record<SSEConnectionStatus, { label: string; dotClass: string; bgClass: string; textClass: string }> = {
  connected: {
    label: 'Live',
    dotClass: 'bg-green-500',
    bgClass: 'bg-green-50 border-green-200',
    textClass: 'text-green-700',
  },
  connecting: {
    label: 'Connecting',
    dotClass: 'bg-yellow-500',
    bgClass: 'bg-yellow-50 border-yellow-200',
    textClass: 'text-yellow-700',
  },
  disconnected: {
    label: 'Offline',
    dotClass: 'bg-gray-400',
    bgClass: 'bg-gray-50 border-gray-200',
    textClass: 'text-gray-500',
  },
};

export function LiveIndicator({ status }: LiveIndicatorProps) {
  const config = statusConfig[status];

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 rounded-full border px-2.5 py-1',
        config.bgClass,
      )}
      role="status"
      aria-label={`Connection: ${config.label}`}
    >
      <span className="relative flex size-2">
        {status === 'connected' && (
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-400 opacity-75" />
        )}
        <span className={cn('relative inline-flex size-2 rounded-full', config.dotClass)} />
      </span>
      <span className={cn('text-[11px] font-semibold', config.textClass)}>{config.label}</span>
    </div>
  );
}
