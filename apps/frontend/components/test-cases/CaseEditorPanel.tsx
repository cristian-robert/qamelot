'use client';

import { FileText } from 'lucide-react';
import { CaseEditor } from './CaseEditor';

interface CaseEditorPanelProps {
  projectId: string;
  caseId: string | null;
}

export function CaseEditorPanel({ projectId, caseId }: CaseEditorPanelProps) {
  if (!caseId) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 text-center">
        <div className="flex size-14 items-center justify-center rounded-xl bg-muted">
          <FileText className="size-7 text-muted-foreground/50" />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            No case selected
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground/70">
            Choose a test case from the list to view and edit its details.
          </p>
        </div>
      </div>
    );
  }

  return <CaseEditor projectId={projectId} caseId={caseId} />;
}
