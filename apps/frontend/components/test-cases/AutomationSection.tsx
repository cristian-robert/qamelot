import { AutomationStatus } from '@app/shared';
import { Badge } from '@/components/ui/badge';

interface AutomationSectionProps {
  automationStatus: AutomationStatus;
  automationId?: string | null;
  automationFilePath?: string | null;
}

export function AutomationSection({
  automationStatus,
  automationId,
  automationFilePath,
}: AutomationSectionProps) {
  return (
    <div className="space-y-3 rounded-lg border p-4">
      <h4 className="text-sm font-medium text-muted-foreground">Automation</h4>
      {automationStatus === AutomationStatus.NOT_AUTOMATED ? (
        <p className="text-sm text-muted-foreground">
          Not linked to any automated test.
        </p>
      ) : (
        <div className="space-y-2">
          <Badge variant={automationStatus === AutomationStatus.AUTOMATED ? 'default' : 'destructive'}>
            {automationStatus === AutomationStatus.AUTOMATED ? 'Automated' : 'Needs Update'}
          </Badge>
          {automationId && (
            <div>
              <span className="text-xs font-medium text-muted-foreground">Automation ID</span>
              <p className="rounded bg-muted px-2 py-1 font-mono text-xs break-all">
                {automationId}
              </p>
            </div>
          )}
          {automationFilePath && (
            <div>
              <span className="text-xs font-medium text-muted-foreground">Spec File</span>
              <p className="rounded bg-muted px-2 py-1 font-mono text-xs break-all">
                {automationFilePath}
              </p>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            This test case is linked to an automated Playwright test.
          </p>
        </div>
      )}
    </div>
  );
}
