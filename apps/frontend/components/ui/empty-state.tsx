import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon: React.ElementType;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <Icon className="size-6 text-muted-foreground/60" />
      </div>
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className="max-w-xs text-xs text-muted-foreground/70">{description}</p>
      {action}
    </div>
  );
}

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  message = 'Something went wrong loading this data.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="size-6 text-destructive" />
      </div>
      <p className="text-sm font-medium text-destructive">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}
