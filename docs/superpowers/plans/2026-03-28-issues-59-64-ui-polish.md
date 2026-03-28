# Issues #59-#64 UI Polish & Pagination Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Batch of 6 P2 issues: resizable panes (#59), enriched project cards (#60), dashboard dead links fix (#61), semantic status badges (#62), split oversized files (#63), and backend/frontend pagination (#64).

**Architecture:** Each issue is an independent task that touches different parts of the codebase. Tasks are ordered to minimize conflicts: file splitting first (changes file structure), then UI component work, then pagination (cross-cutting backend+frontend).

**Tech Stack:** Next.js 16 App Router, shadcn/ui (resizable panels, badges), Tailwind v4, NestJS + Prisma, react-resizable-panels

---

## File Structure

### New Files
- `apps/frontend/components/ui/resizable.tsx` — shadcn resizable panel component
- `apps/frontend/components/test-cases/CaseEditorForm.tsx` — extracted form section from CaseEditor
- `apps/frontend/components/test-cases/StepSyncLogic.ts` — extracted step CRUD sync logic
- `apps/frontend/components/test-cases/AutomationSection.tsx` — extracted automation display
- `apps/frontend/components/test-cases/CsvUploadStep.tsx` — wizard step 1
- `apps/frontend/components/test-cases/CsvMappingStep.tsx` — wizard step 2
- `apps/frontend/components/test-cases/CsvPreviewStep.tsx` — wizard step 3
- `apps/frontend/components/test-cases/CsvResultStep.tsx` — wizard step 4
- `apps/frontend/components/test-cases/BulkUpdateDialog.tsx` — parameterized bulk dialog
- `apps/frontend/components/projects/ProjectCard.tsx` — enriched project card component
- `apps/frontend/components/shared/StatusBadge.tsx` — unified semantic status badge
- `apps/frontend/components/shared/Pagination.tsx` — shared pagination controls

### Modified Files
- `apps/frontend/app/(dashboard)/projects/[id]/cases/page.tsx` — resizable panes + extract bulk dialogs
- `apps/frontend/components/test-cases/CaseEditor.tsx` — split into sub-components
- `apps/frontend/components/test-cases/CsvImportWizard.tsx` — split into step components
- `apps/frontend/components/test-cases/CaseListPanel.tsx` — remove hardcoded width
- `apps/frontend/components/test-suites/SuiteTree.tsx` — remove hardcoded width
- `apps/frontend/components/test-cases/CaseEditorPanel.tsx` — remove hardcoded width
- `apps/frontend/app/(dashboard)/dashboard/page.tsx` — fix dead links, improve quick links
- `apps/frontend/app/(dashboard)/projects/page.tsx` — enriched project cards
- `apps/frontend/lib/constants/status-styles.ts` — add semantic badge style maps
- `apps/frontend/app/(dashboard)/projects/[id]/plans/page.tsx` — use StatusBadge
- `apps/frontend/app/(dashboard)/projects/[id]/milestones/page.tsx` — use StatusBadge
- `apps/frontend/app/(dashboard)/users/page.tsx` — use StatusBadge for roles
- Backend: multiple controllers and services for pagination
- `packages/shared/src/types/index.ts` — add ProjectStatsDto type

---

## Task 1: Split CaseEditor.tsx (#63)

**Files:**
- Create: `apps/frontend/components/test-cases/StepSyncLogic.ts`
- Create: `apps/frontend/components/test-cases/AutomationSection.tsx`
- Create: `apps/frontend/components/test-cases/CaseEditorForm.tsx`
- Modify: `apps/frontend/components/test-cases/CaseEditor.tsx`

**Current:** 477 lines. **Target:** each file under 300 lines.

- [ ] **Step 1: Extract StepSyncLogic.ts**

Create `apps/frontend/components/test-cases/StepSyncLogic.ts` containing the step sync function extracted from CaseEditor lines 116-167:

```typescript
import { testCasesApi } from '@/lib/api/test-cases';
import type { TestCaseStepDto } from '@app/shared';
import type { StepData } from './StepEditor';

export async function syncSteps(
  projectId: string,
  caseId: string,
  steps: StepData[],
  originalSteps: TestCaseStepDto[],
): Promise<void> {
  const origIds = new Set(originalSteps.map((s) => s.id));

  // Delete removed steps
  for (const orig of originalSteps) {
    const stillExists = steps.some((s) => s.id === orig.id);
    if (!stillExists) {
      await testCasesApi.deleteStep(projectId, caseId, orig.id);
    }
  }

  // Create new steps and update existing
  for (const step of steps) {
    if (step.id && origIds.has(step.id)) {
      const orig = originalSteps.find((o) => o.id === step.id);
      if (orig && (orig.description !== step.description || orig.expectedResult !== step.expectedResult)) {
        await testCasesApi.updateStep(projectId, caseId, step.id, {
          description: step.description,
          expectedResult: step.expectedResult,
        });
      }
    } else {
      await testCasesApi.createStep(projectId, caseId, {
        description: step.description || 'New step',
        expectedResult: step.expectedResult || 'Expected result',
      });
    }
  }

  // Reorder if needed
  const freshSteps = await testCasesApi.listSteps(projectId, caseId);
  if (freshSteps.length > 1) {
    const orderedIds = steps
      .map((s) => {
        if (s.id && freshSteps.some((fs) => fs.id === s.id)) return s.id;
        return freshSteps.find(
          (fs) => fs.description === (s.description || 'New step') && !steps.some((existing) => existing.id === fs.id),
        )?.id;
      })
      .filter(Boolean) as string[];

    if (orderedIds.length === freshSteps.length) {
      await testCasesApi.reorderSteps(projectId, caseId, orderedIds);
    }
  }
}
```

- [ ] **Step 2: Extract AutomationSection.tsx**

Create `apps/frontend/components/test-cases/AutomationSection.tsx`:

```tsx
'use client';

import { Badge } from '@/components/ui/badge';
import { AutomationStatus } from '@app/shared';

interface AutomationSectionProps {
  automationStatus: string;
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
```

- [ ] **Step 3: Update CaseEditor.tsx to use extracted modules**

Replace the step sync block (lines 116-167) with a call to `syncSteps()`, and replace the automation section JSX (lines 416-448) with `<AutomationSection>`. The file should drop to ~300 lines.

In CaseEditor.tsx, update the import and onSubmit:

```typescript
import { syncSteps } from './StepSyncLogic';
import { AutomationSection } from './AutomationSection';
```

In `onSubmit`, replace lines 116-167 with:
```typescript
if (currentTemplate === TemplateType.STEPS) {
  await syncSteps(projectId, caseId, steps, originalStepsRef.current);
}
```

In the JSX, replace lines 416-448 with:
```tsx
<AutomationSection
  automationStatus={testCase.automationStatus}
  automationId={testCase.automationId}
  automationFilePath={testCase.automationFilePath}
/>
```

- [ ] **Step 4: Verify line counts**

Run: `wc -l apps/frontend/components/test-cases/CaseEditor.tsx apps/frontend/components/test-cases/StepSyncLogic.ts apps/frontend/components/test-cases/AutomationSection.tsx`

Expected: All files under 300 lines.

- [ ] **Step 5: Run typecheck**

Run: `pnpm --filter frontend typecheck`
Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add apps/frontend/components/test-cases/CaseEditor.tsx apps/frontend/components/test-cases/StepSyncLogic.ts apps/frontend/components/test-cases/AutomationSection.tsx
git commit -m "refactor(frontend): split CaseEditor into sub-modules

Extract StepSyncLogic and AutomationSection to bring CaseEditor
under the 300-line limit.

Refs #63"
```

---

## Task 2: Split CsvImportWizard.tsx (#63)

**Files:**
- Create: `apps/frontend/components/test-cases/CsvUploadStep.tsx`
- Create: `apps/frontend/components/test-cases/CsvMappingStep.tsx`
- Create: `apps/frontend/components/test-cases/CsvPreviewStep.tsx`
- Create: `apps/frontend/components/test-cases/CsvResultStep.tsx`
- Modify: `apps/frontend/components/test-cases/CsvImportWizard.tsx`

**Current:** 401 lines. **Target:** each file under 300 lines.

- [ ] **Step 1: Create CsvUploadStep.tsx**

Extract the upload drag-and-drop UI (lines 184-221):

```tsx
'use client';

import { useRef } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CsvUploadStepProps {
  dragActive: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onFileSelect: (file: File) => void;
}

export function CsvUploadStep({
  dragActive,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileSelect,
}: CsvUploadStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className={`flex flex-col items-center gap-3 rounded-lg border-2 border-dashed p-8 transition-colors ${
        dragActive
          ? 'border-primary bg-primary/5'
          : 'border-muted-foreground/20'
      }`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <Upload className="size-10 text-muted-foreground/40" />
      <p className="text-sm text-muted-foreground">
        Drag & drop a CSV file here
      </p>
      <p className="text-xs text-muted-foreground/60">or</p>
      <Button
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
      >
        Browse Files
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={(e) => {
          const selected = e.target.files?.[0];
          if (selected) onFileSelect(selected);
        }}
      />
    </div>
  );
}
```

- [ ] **Step 2: Create CsvMappingStep.tsx**

Extract column mapping UI (lines 224-258):

```tsx
'use client';

import { ArrowRight } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';

const FIELD_OPTIONS = [
  { value: '__skip__', label: 'Skip' },
  { value: 'title', label: 'Title' },
  { value: 'priority', label: 'Priority' },
  { value: 'type', label: 'Type' },
  { value: 'preconditions', label: 'Preconditions' },
  { value: 'estimate', label: 'Estimate' },
  { value: 'references', label: 'References' },
] as const;

export { FIELD_OPTIONS };

interface CsvMappingStepProps {
  headers: string[];
  columnMappings: string[];
  onMappingChange: (index: number, value: string) => void;
}

export function CsvMappingStep({
  headers,
  columnMappings,
  onMappingChange,
}: CsvMappingStepProps) {
  return (
    <ScrollArea className="max-h-64">
      <div className="space-y-2">
        {headers.map((header, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-md bg-muted/30 px-3 py-2"
          >
            <span className="min-w-0 flex-1 truncate text-sm font-medium">
              {header}
            </span>
            <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" />
            <Select
              value={columnMappings[i] ?? '__skip__'}
              onValueChange={(val) => onMappingChange(i, val ?? '__skip__')}
            >
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FIELD_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
```

- [ ] **Step 3: Create CsvPreviewStep.tsx**

Extract preview table (lines 262-303):

```tsx
'use client';

import { ScrollArea } from '@/components/ui/scroll-area';

interface CsvPreviewStepProps {
  headers: string[];
  rows: string[][];
  columnMappings: string[];
}

export function CsvPreviewStep({
  headers,
  rows,
  columnMappings,
}: CsvPreviewStepProps) {
  return (
    <ScrollArea className="max-h-64">
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">
          Preview of first {Math.min(rows.length, 5)} rows:
        </p>
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-muted/50">
                {headers.map((h, i) =>
                  columnMappings[i] !== '__skip__' ? (
                    <th key={i} className="px-2 py-1.5 text-left font-medium">
                      {columnMappings[i]}
                    </th>
                  ) : null,
                )}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 5).map((row, ri) => (
                <tr key={ri} className="border-b last:border-0">
                  {row.map((cell, ci) =>
                    columnMappings[ci] !== '__skip__' ? (
                      <td
                        key={ci}
                        className="max-w-32 truncate px-2 py-1.5"
                      >
                        {cell}
                      </td>
                    ) : null,
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground">
          Total: {rows.length} row{rows.length !== 1 ? 's' : ''} to import
        </p>
      </div>
    </ScrollArea>
  );
}
```

- [ ] **Step 4: Create CsvResultStep.tsx**

Extract result display (lines 307-344):

```tsx
'use client';

import { CheckCircle2, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { CsvImportResult } from '@/lib/api/test-cases';

interface CsvResultStepProps {
  result: CsvImportResult;
}

export function CsvResultStep({ result }: CsvResultStepProps) {
  return (
    <div className="space-y-3">
      {result.imported > 0 && (
        <div className="flex items-center gap-2 rounded-md bg-status-passed/10 p-3 text-status-passed">
          <CheckCircle2 className="size-5 shrink-0" />
          <p className="text-sm font-medium">
            Successfully imported {result.imported} test case
            {result.imported !== 1 ? 's' : ''}
          </p>
        </div>
      )}
      {result.errors.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            <p className="text-sm font-medium">
              {result.errors.length} error{result.errors.length !== 1 ? 's' : ''}
            </p>
          </div>
          <ScrollArea className="max-h-40">
            <div className="space-y-1">
              {result.errors.map((err, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded bg-destructive/5 px-2 py-1 text-xs"
                >
                  <Badge variant="destructive" className="h-4 text-[10px]">
                    Row {err.row}
                  </Badge>
                  <span className="text-muted-foreground">{err.field}:</span>
                  <span>{err.message}</span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Update CsvImportWizard.tsx to use extracted steps**

Replace the inline step JSX with the new components. Move `FIELD_OPTIONS` and `parseCsv` to `CsvMappingStep.tsx` (FIELD_OPTIONS already exported). Keep `parseCsv` in CsvImportWizard since it's used in handleFile. The wizard file should import and render `<CsvUploadStep>`, `<CsvMappingStep>`, `<CsvPreviewStep>`, `<CsvResultStep>`.

- [ ] **Step 6: Verify line counts**

Run: `wc -l apps/frontend/components/test-cases/CsvImportWizard.tsx apps/frontend/components/test-cases/Csv*Step.tsx`

Expected: All files under 300 lines.

- [ ] **Step 7: Run typecheck**

Run: `pnpm --filter frontend typecheck`
Expected: no errors

- [ ] **Step 8: Commit**

```bash
git add apps/frontend/components/test-cases/CsvImportWizard.tsx apps/frontend/components/test-cases/CsvUploadStep.tsx apps/frontend/components/test-cases/CsvMappingStep.tsx apps/frontend/components/test-cases/CsvPreviewStep.tsx apps/frontend/components/test-cases/CsvResultStep.tsx
git commit -m "refactor(frontend): split CsvImportWizard into step components

Extract each wizard step into its own component to bring
CsvImportWizard under the 300-line limit.

Refs #63"
```

---

## Task 3: Extract BulkUpdateDialog from cases/page.tsx (#63)

**Files:**
- Create: `apps/frontend/components/test-cases/BulkUpdateDialog.tsx`
- Modify: `apps/frontend/app/(dashboard)/projects/[id]/cases/page.tsx`

**Current:** 332 lines. **Target:** under 300 lines.

The 3 bulk dialogs (move, priority, type) at lines 192-310 are nearly identical. Extract into a single parameterized component.

- [ ] **Step 1: Create BulkUpdateDialog.tsx**

```tsx
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';

interface BulkUpdateDialogOption {
  value: string;
  label: string;
}

interface BulkUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  placeholder: string;
  options: BulkUpdateDialogOption[];
  value: string;
  onValueChange: (value: string) => void;
  onConfirm: () => void;
  isPending: boolean;
  confirmLabel?: string;
}

export function BulkUpdateDialog({
  open,
  onOpenChange,
  title,
  description,
  placeholder,
  options,
  value,
  onValueChange,
  onConfirm,
  isPending,
  confirmLabel = 'Apply',
}: BulkUpdateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Select value={value} onValueChange={(val) => onValueChange(val ?? '')}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={!value || isPending}
          >
            {isPending ? 'Updating...' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Update cases/page.tsx to use BulkUpdateDialog**

Replace the 3 separate Dialog blocks (lines 192-310) with 3 `<BulkUpdateDialog>` instances. Example for move:

```tsx
<BulkUpdateDialog
  open={bulkDialog === 'move'}
  onOpenChange={(open) => !open && setBulkDialog(null)}
  title={`Move ${selection.count} case(s)`}
  description="Select the target suite to move the selected cases."
  placeholder="Select target suite"
  options={(suites ?? [])
    .filter((s: TestSuiteDto) => s.id !== selectedSuiteId)
    .map((s: TestSuiteDto) => ({ value: s.id, label: s.name }))}
  value={bulkValue}
  onValueChange={setBulkValue}
  onConfirm={handleBulkMove}
  isPending={bulkMoveMutation.isPending}
  confirmLabel="Move"
/>
```

Similarly for priority (options: `['CRITICAL','HIGH','MEDIUM','LOW']` mapped to `{value, label}`) and type (options: `['FUNCTIONAL','REGRESSION','SMOKE','EXPLORATORY','OTHER']`).

- [ ] **Step 3: Verify line count and typecheck**

Run: `wc -l apps/frontend/app/\(dashboard\)/projects/\[id\]/cases/page.tsx`
Expected: under 300 lines

Run: `pnpm --filter frontend typecheck`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add apps/frontend/components/test-cases/BulkUpdateDialog.tsx "apps/frontend/app/(dashboard)/projects/[id]/cases/page.tsx"
git commit -m "refactor(frontend): extract BulkUpdateDialog to reduce cases/page.tsx

Replace 3 nearly identical bulk action dialogs with a single
parameterized BulkUpdateDialog component.

Refs #63"
```

---

## Task 4: Fix dashboard dead links and quick links (#61)

**Files:**
- Modify: `apps/frontend/app/(dashboard)/dashboard/page.tsx`

- [ ] **Step 1: Fix "New Project" button**

The dashboard "New Project" button at line 63-68 links to `/projects` instead of opening the create dialog. Fix by linking to `/projects?create=true` so the projects page opens the dialog.

In `apps/frontend/app/(dashboard)/dashboard/page.tsx`, change:

```tsx
<Link href="/projects">
  <Button size="sm">
    <Plus className="mr-1.5 size-3.5" />
    New Project
  </Button>
</Link>
```

to:

```tsx
<Link href="/projects?create=true">
  <Button size="sm">
    <Plus className="mr-1.5 size-3.5" />
    New Project
  </Button>
</Link>
```

- [ ] **Step 2: Update projects page to honor ?create=true**

In `apps/frontend/app/(dashboard)/projects/page.tsx`, read the URL search param and auto-open the dialog:

Add `useSearchParams` import and use it to initialize `open` state:

```tsx
import { useSearchParams, useRouter } from 'next/navigation';

// Inside component:
const searchParams = useSearchParams();
const router = useRouter();
const [open, setOpen] = useState(searchParams.get('create') === 'true');

// When dialog closes, clean URL:
function handleOpenChange(isOpen: boolean) {
  setOpen(isOpen);
  if (!isOpen && searchParams.get('create') === 'true') {
    router.replace('/projects');
  }
}
```

Update `<Dialog open={open} onOpenChange={setOpen}>` to use `handleOpenChange`.

- [ ] **Step 3: Make quick links contextual**

Replace the 3 generic quick links (all pointing to `/projects`) with contextual links. Use the already-fetched `projects` data to link to the first project's cases, runs, and reports.

```tsx
{/* Quick links row */}
{projects && projects.length > 0 && (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
    <QuickLink
      href={`/projects/${projects[0].id}/cases`}
      icon={TestTube2}
      title="Test Cases"
      description={`Open ${projects[0].name} test cases`}
    />
    <QuickLink
      href={`/projects/${projects[0].id}/plans`}
      icon={Play}
      title="Test Plans"
      description={`Open ${projects[0].name} test plans`}
    />
    <QuickLink
      href={`/projects/${projects[0].id}/reports`}
      icon={BarChart3}
      title="Reports"
      description={`Open ${projects[0].name} reports`}
    />
  </div>
)}
```

- [ ] **Step 4: Run typecheck**

Run: `pnpm --filter frontend typecheck`
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add "apps/frontend/app/(dashboard)/dashboard/page.tsx" "apps/frontend/app/(dashboard)/projects/page.tsx"
git commit -m "fix(frontend): fix dashboard dead links and contextual quick links

'New Project' now opens the create dialog via ?create=true.
Quick links now point to the first project's cases/plans/reports
instead of generic /projects.

Closes #61"
```

---

## Task 5: Add semantic status badges (#62)

**Files:**
- Create: `apps/frontend/components/shared/StatusBadge.tsx`
- Modify: `apps/frontend/lib/constants/status-styles.ts`
- Modify: `apps/frontend/app/(dashboard)/projects/[id]/plans/page.tsx`
- Modify: `apps/frontend/app/(dashboard)/projects/[id]/milestones/page.tsx`

- [ ] **Step 1: Add semantic badge color maps to status-styles.ts**

The existing `planStatusBadgeVariant` and `milestoneStatusBadgeVariant` maps only use generic shadcn variants (default/secondary/outline) without semantic color. Add explicit bg+text+border style maps similar to the existing `statusBadgeStyles` for test results.

Add to `apps/frontend/lib/constants/status-styles.ts`:

```typescript
/** Plan status badge: bg + text + border for semantic coloring */
export const planStatusBadgeStyles: Record<TestPlanStatus, string> = {
  [TestPlanStatus.DRAFT]: 'bg-slate-50 text-slate-600 border-slate-200',
  [TestPlanStatus.ACTIVE]: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  [TestPlanStatus.COMPLETED]: 'bg-teal-50 text-teal-700 border-teal-200',
  [TestPlanStatus.ARCHIVED]: 'bg-gray-50 text-gray-500 border-gray-200',
};

/** Milestone status badge: bg + text + border for semantic coloring */
export const milestoneStatusBadgeStyles: Record<MilestoneStatus, string> = {
  [MilestoneStatus.OPEN]: 'bg-blue-50 text-blue-700 border-blue-200',
  [MilestoneStatus.CLOSED]: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};
```

- [ ] **Step 2: Create StatusBadge component**

Create `apps/frontend/components/shared/StatusBadge.tsx`:

```tsx
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  label: string;
  className?: string;
}

export function StatusBadge({ label, className }: StatusBadgeProps) {
  return (
    <Badge variant="outline" className={cn('text-[10px] font-semibold uppercase', className)}>
      {label}
    </Badge>
  );
}
```

- [ ] **Step 3: Update plans page to use semantic badges**

In `apps/frontend/app/(dashboard)/projects/[id]/plans/page.tsx`, replace:

```tsx
<Badge variant={planStatusBadgeVariant[plan.status] ?? 'secondary'}>
  {plan.status}
</Badge>
```

with:

```tsx
import { planStatusBadgeStyles } from '@/lib/constants';
import { StatusBadge } from '@/components/shared/StatusBadge';

<StatusBadge
  label={plan.status}
  className={planStatusBadgeStyles[plan.status]}
/>
```

Remove the `planStatusBadgeVariant` import if no longer used.

- [ ] **Step 4: Update milestones page to use semantic badges**

In `apps/frontend/app/(dashboard)/projects/[id]/milestones/page.tsx` (line 217-220), replace:

```tsx
<Badge
  variant={node.status === MilestoneStatus.OPEN ? 'default' : 'secondary'}
>
  {node.status}
</Badge>
```

with:

```tsx
import { milestoneStatusBadgeStyles } from '@/lib/constants';
import { StatusBadge } from '@/components/shared/StatusBadge';

<StatusBadge
  label={node.status}
  className={milestoneStatusBadgeStyles[node.status]}
/>
```

- [ ] **Step 5: Run typecheck**

Run: `pnpm --filter frontend typecheck`
Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add apps/frontend/lib/constants/status-styles.ts apps/frontend/components/shared/StatusBadge.tsx "apps/frontend/app/(dashboard)/projects/[id]/plans/page.tsx" "apps/frontend/app/(dashboard)/projects/[id]/milestones/page.tsx"
git commit -m "feat(frontend): add semantic colors to status badges

Add bg+text+border style maps for plan and milestone statuses.
DRAFT=slate, ACTIVE=emerald, COMPLETED=teal, ARCHIVED=gray.
OPEN=blue, CLOSED=emerald. Role badges already had semantic colors.

Closes #62"
```

---

## Task 6: Add resizable panes to test case editor (#59)

**Files:**
- Create: `apps/frontend/components/ui/resizable.tsx` (via shadcn CLI)
- Modify: `apps/frontend/app/(dashboard)/projects/[id]/cases/page.tsx`
- Modify: `apps/frontend/components/test-suites/SuiteTree.tsx`
- Modify: `apps/frontend/components/test-cases/CaseListPanel.tsx`

- [ ] **Step 1: Install shadcn resizable component**

Run: `cd apps/frontend && npx shadcn@latest add resizable`

This installs `react-resizable-panels` and creates `components/ui/resizable.tsx`.

If the CLI doesn't work with the project config, manually install and create the component:

```bash
cd apps/frontend && pnpm add react-resizable-panels
```

Then create `apps/frontend/components/ui/resizable.tsx`:

```tsx
'use client';

import { GripVertical } from 'lucide-react';
import * as ResizablePrimitive from 'react-resizable-panels';
import { cn } from '@/lib/utils';

export const ResizablePanelGroup = ({
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelGroup>) => (
  <ResizablePrimitive.PanelGroup
    className={cn(
      'flex h-full w-full data-[panel-group-direction=vertical]:flex-col',
      className,
    )}
    {...props}
  />
);

export const ResizablePanel = ResizablePrimitive.Panel;

export const ResizableHandle = ({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelResizeHandle> & {
  withHandle?: boolean;
}) => (
  <ResizablePrimitive.PanelResizeHandle
    className={cn(
      'relative flex w-px items-center justify-center bg-border after:absolute after:inset-y-0 after:-left-1 after:-right-1 after:content-[\'\'] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:inset-x-0 data-[panel-group-direction=vertical]:after:-top-1 data-[panel-group-direction=vertical]:after:-bottom-1 [&[data-resize-handle-state=drag]]:bg-primary [&[data-resize-handle-state=hover]]:bg-primary',
      className,
    )}
    {...props}
  >
    {withHandle && (
      <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border">
        <GripVertical className="size-2.5" />
      </div>
    )}
  </ResizablePrimitive.PanelResizeHandle>
);
```

- [ ] **Step 2: Remove hardcoded widths from SuiteTree**

In `apps/frontend/components/test-suites/SuiteTree.tsx`, change the root div (line 176):

From: `className="flex w-60 min-h-0 shrink-0 flex-col border-r overflow-hidden"`
To: `className="flex min-h-0 flex-col overflow-hidden"`

Remove the `border-r` since the ResizableHandle will provide the separator.

Also update the empty/no-suite state div (line 67) in CaseListPanel.tsx:

From: `className="flex w-[360px] shrink-0 flex-col items-center justify-center border-r text-center"`
To: `className="flex shrink-0 flex-col items-center justify-center text-center"`

- [ ] **Step 3: Remove hardcoded width from CaseListPanel**

In `apps/frontend/components/test-cases/CaseListPanel.tsx`:

Line 67: Remove `w-[360px]` and `border-r` from the no-suite state div.
Line 77: Change `className="flex w-[360px] min-h-0 shrink-0 flex-col border-r overflow-hidden"` to `className="flex min-h-0 flex-col overflow-hidden"`.

- [ ] **Step 4: Wrap 3-pane layout with ResizablePanelGroup**

In `apps/frontend/app/(dashboard)/projects/[id]/cases/page.tsx`, replace the 3-pane layout (lines 156-171):

```tsx
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';

{/* Three-pane layout */}
<div className="mx-6 mb-6 flex min-h-0 flex-1 overflow-hidden rounded-lg border bg-card">
  <ResizablePanelGroup
    direction="horizontal"
    autoSaveId="qamelot-cases-layout"
  >
    <ResizablePanel defaultSize={15} minSize={10} maxSize={30}>
      <SuiteTree
        projectId={projectId}
        selectedSuiteId={selectedSuiteId}
        onSelectSuite={handleSelectSuite}
      />
    </ResizablePanel>
    <ResizableHandle withHandle />
    <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
      <CaseListPanel
        projectId={projectId}
        suiteId={selectedSuiteId}
        suiteName={selectedSuite?.name}
        selectedCaseId={selectedCaseId}
        onSelectCase={handleSelectCase}
        selection={selection}
      />
    </ResizablePanel>
    <ResizableHandle withHandle />
    <ResizablePanel defaultSize={55} minSize={30}>
      <CaseEditorPanel projectId={projectId} caseId={selectedCaseId} />
    </ResizablePanel>
  </ResizablePanelGroup>
</div>
```

Note: `autoSaveId` persists sizes to localStorage automatically.

- [ ] **Step 5: Run typecheck**

Run: `pnpm --filter frontend typecheck`
Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add apps/frontend/components/ui/resizable.tsx apps/frontend/components/test-suites/SuiteTree.tsx apps/frontend/components/test-cases/CaseListPanel.tsx "apps/frontend/app/(dashboard)/projects/[id]/cases/page.tsx"
git commit -m "feat(frontend): add resizable panes to test case editor

Install react-resizable-panels and wrap the 3-pane layout
(suite tree, case list, case editor) with ResizablePanelGroup.
Sizes persist to localStorage via autoSaveId.

Closes #59"
```

---

## Task 7: Enrich project cards (#60)

**Files:**
- Modify: `packages/shared/src/types/index.ts` — add ProjectStatsDto
- Modify: `apps/backend/src/reports/reports.service.ts` — add per-project stats
- Modify: `apps/backend/src/reports/reports.controller.ts` — expose stats endpoint
- Modify: `apps/frontend/lib/api/reports.ts` — add getProjectStats
- Modify: `apps/frontend/lib/reports/useReports.ts` — add useProjectStats hook
- Create: `apps/frontend/components/projects/ProjectCard.tsx`
- Modify: `apps/frontend/app/(dashboard)/projects/page.tsx`

- [ ] **Step 1: Add ProjectStatsDto to shared types**

In `packages/shared/src/types/index.ts`, add:

```typescript
export interface ProjectStatsDto {
  projectId: string;
  caseCount: number;
  activeRunCount: number;
  passRate: number;
  lastActivityAt: string | null;
}
```

Export it from `packages/shared/src/index.ts`.

- [ ] **Step 2: Add backend endpoint for project stats**

In `apps/backend/src/reports/reports.service.ts`, add a method:

```typescript
async getProjectsStats(): Promise<ProjectStatsDto[]> {
  const projects = await this.prisma.project.findMany({
    where: { deletedAt: null },
    select: { id: true },
  });

  return Promise.all(
    projects.map(async (project) => {
      const [caseCount, activeRunCount, lastResult] = await Promise.all([
        this.prisma.testCase.count({
          where: { projectId: project.id, deletedAt: null },
        }),
        this.prisma.testRun.count({
          where: {
            status: 'IN_PROGRESS',
            deletedAt: null,
            testPlan: { projectId: project.id },
          },
        }),
        this.prisma.testResult.findFirst({
          where: {
            testRun: { testPlan: { projectId: project.id }, deletedAt: null },
          },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true },
        }),
      ]);

      // Calculate pass rate for this project
      const totalResults = await this.prisma.testResult.count({
        where: {
          testRun: { testPlan: { projectId: project.id }, deletedAt: null },
        },
      });
      const passedResults = totalResults > 0
        ? await this.prisma.testResult.count({
            where: {
              status: 'PASSED',
              testRun: { testPlan: { projectId: project.id }, deletedAt: null },
            },
          })
        : 0;

      return {
        projectId: project.id,
        caseCount,
        activeRunCount,
        passRate: totalResults > 0 ? Math.round((passedResults / totalResults) * 100) : 0,
        lastActivityAt: lastResult?.createdAt?.toISOString() ?? null,
      };
    }),
  );
}
```

In `apps/backend/src/reports/reports.controller.ts`, add:

```typescript
@Get('reports/projects-stats')
@ApiOperation({ summary: 'Get stats for all projects (case count, active runs, pass rate)' })
@ApiResponse({ status: 200, description: 'Per-project statistics' })
getProjectsStats() {
  return this.reportsService.getProjectsStats();
}
```

- [ ] **Step 3: Add frontend API client and hook**

In `apps/frontend/lib/api/reports.ts`, add:

```typescript
import type { ProjectStatsDto } from '@app/shared';

getProjectsStats: () => apiFetch<ProjectStatsDto[]>('/reports/projects-stats'),
```

In `apps/frontend/lib/reports/useReports.ts`, add:

```typescript
export function useProjectsStats() {
  return useQuery({
    queryKey: ['reports', 'projects-stats'],
    queryFn: () => reportsApi.getProjectsStats(),
  });
}
```

- [ ] **Step 4: Create ProjectCard component**

Create `apps/frontend/components/projects/ProjectCard.tsx`:

```tsx
'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatRelativeTime } from '@/lib/format';
import type { ProjectDto, ProjectStatsDto } from '@app/shared';

interface ProjectCardProps {
  project: ProjectDto;
  stats?: ProjectStatsDto;
}

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-purple-100 text-purple-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-teal-100 text-teal-700',
  'bg-indigo-100 text-indigo-700',
  'bg-orange-100 text-orange-700',
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function PassRateIndicator({ rate }: { rate: number }) {
  const color = rate >= 80 ? 'text-emerald-600' : rate >= 50 ? 'text-amber-600' : 'text-red-600';
  return (
    <span className={`text-xs font-semibold ${color}`}>
      {rate}%
    </span>
  );
}

export function ProjectCard({ project, stats }: ProjectCardProps) {
  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="cursor-pointer transition-all hover:shadow-md hover:border-primary/30">
        <CardHeader className="flex-row items-start gap-3 space-y-0">
          <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${getAvatarColor(project.name)}`}>
            {project.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle className="truncate text-base">{project.name}</CardTitle>
            {project.description && (
              <CardDescription className="mt-0.5 line-clamp-2">
                {project.description}
              </CardDescription>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {stats ? (
              <>
                <span>{stats.caseCount} cases</span>
                <span className="text-border">|</span>
                <span>{stats.activeRunCount} active run{stats.activeRunCount !== 1 ? 's' : ''}</span>
                <span className="text-border">|</span>
                <PassRateIndicator rate={stats.passRate} />
              </>
            ) : (
              <span>Loading stats...</span>
            )}
          </div>
          {stats?.lastActivityAt && (
            <p className="mt-1.5 text-[11px] text-muted-foreground/70">
              Last activity {formatRelativeTime(stats.lastActivityAt)}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
```

- [ ] **Step 5: Update projects page to use ProjectCard**

In `apps/frontend/app/(dashboard)/projects/page.tsx`, replace the inline card rendering with `<ProjectCard>`:

```tsx
import { ProjectCard } from '@/components/projects/ProjectCard';
import { useProjectsStats } from '@/lib/reports/useReports';

// Inside component:
const { data: projectsStats } = useProjectsStats();

// In the grid:
{projects.map((project: ProjectDto) => {
  const stats = projectsStats?.find((s) => s.projectId === project.id);
  return (
    <ProjectCard key={project.id} project={project} stats={stats} />
  );
})}
```

- [ ] **Step 6: Run typecheck**

Run: `pnpm typecheck`
Expected: no errors

- [ ] **Step 7: Commit**

```bash
git add packages/shared/src/types/index.ts packages/shared/src/index.ts apps/backend/src/reports/reports.service.ts apps/backend/src/reports/reports.controller.ts apps/frontend/lib/api/reports.ts apps/frontend/lib/reports/useReports.ts apps/frontend/components/projects/ProjectCard.tsx "apps/frontend/app/(dashboard)/projects/page.tsx"
git commit -m "feat(frontend): enrich project cards with stats, avatars, and pass rate

Add GET /reports/projects-stats backend endpoint that returns per-project
case count, active runs, pass rate, and last activity. Project cards now
show color avatars, stats row, and relative activity timestamp.

Closes #60"
```

---

## Task 8: Add pagination to backend list endpoints (#64)

**Files:**
- Modify: multiple backend controllers and services
- Modify: `packages/shared/src/types/index.ts`

The existing test-cases pagination pattern uses `page`, `pageSize` query params and returns `PaginatedResponse<T>` with `{ data, total, page, pageSize, totalPages }`. Apply the same pattern to all list endpoints.

**Endpoints to paginate (high-traffic lists only):**
- `GET /projects` — ProjectsService.findAll
- `GET /projects/:projectId/plans` — TestPlansService.findAllByProject
- `GET /plans/:planId/runs` — TestRunsService.findAllByPlan
- `GET /projects/:projectId/defects` — DefectsService.findAllByProject
- `GET /users` — UsersService.findAll
- `GET /projects/:projectId/shared-steps` — SharedStepsService.findAllByProject

Skip low-cardinality lists (suites, milestones, configs, custom-field definitions, attachments, API keys) — these won't grow large enough to need pagination.

- [ ] **Step 1: Add PaginationQueryDto to shared**

In `packages/shared/src/types/index.ts`, add (if not already present — `PaginatedResponse<T>` exists at line 356):

```typescript
export interface PaginationQuery {
  page?: number;
  pageSize?: number;
}
```

- [ ] **Step 2: Add pagination to ProjectsService**

In `apps/backend/src/projects/projects.service.ts`, update `findAll()`:

```typescript
async findAll(options?: { page?: number; pageSize?: number }) {
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 50;
  const skip = (page - 1) * pageSize;

  const where = { deletedAt: null };

  const [data, total] = await Promise.all([
    this.prisma.project.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    this.prisma.project.count({ where }),
  ]);

  return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}
```

In `apps/backend/src/projects/projects.controller.ts`, update the GET endpoint:

```typescript
@Get()
@ApiQuery({ name: 'page', required: false, type: Number })
@ApiQuery({ name: 'pageSize', required: false, type: Number })
findAll(
  @Query('page') page?: string,
  @Query('pageSize') pageSize?: string,
) {
  return this.projectsService.findAll({
    page: page ? parseInt(page, 10) : undefined,
    pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
  });
}
```

- [ ] **Step 3: Add pagination to TestPlansService**

Same pattern as Step 2. Update `findAllByProject()` to accept `page`/`pageSize`, add `skip`/`take` to the Prisma query, return `PaginatedResponse`. Update controller to accept `@Query('page')` and `@Query('pageSize')`.

- [ ] **Step 4: Add pagination to TestRunsService**

Same pattern. Update `findAllByPlan()`.

- [ ] **Step 5: Add pagination to DefectsService**

Same pattern. Update `findAllByProject()`.

- [ ] **Step 6: Add pagination to UsersService**

Same pattern. Update `findAll()`.

- [ ] **Step 7: Add pagination to SharedStepsService**

Same pattern. Update `findAllByProject()`.

- [ ] **Step 8: Update existing backend tests**

For each service spec file, update the `findAll` / `findAllByProject` tests to expect paginated responses. The mock should return `{ data: [...], total: N, page: 1, pageSize: 50, totalPages: 1 }`.

- [ ] **Step 9: Run backend tests and typecheck**

Run: `pnpm --filter backend test`
Run: `pnpm --filter backend typecheck`
Expected: all pass

- [ ] **Step 10: Commit backend pagination**

```bash
git add apps/backend/src/ packages/shared/src/types/index.ts
git commit -m "feat(backend): add pagination to all major list endpoints

Apply page/pageSize query params to projects, plans, runs,
defects, users, and shared-steps list endpoints.
All return PaginatedResponse<T> consistent with test-cases.

Refs #64"
```

---

## Task 9: Add frontend pagination (#64)

**Files:**
- Create: `apps/frontend/components/shared/Pagination.tsx`
- Modify: frontend API clients and hooks for paginated endpoints
- Modify: frontend list pages

- [ ] **Step 1: Create shared Pagination component**

Create `apps/frontend/components/shared/Pagination.tsx`:

```tsx
'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 pt-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
      >
        <ChevronLeft className="size-4" />
        Previous
      </Button>
      <span className="text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
      >
        Next
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Update frontend API clients**

Update `apps/frontend/lib/api/projects.ts`:

```typescript
import type { ProjectDto, PaginatedResponse } from '@app/shared';

list: (params?: { page?: number; pageSize?: number }) => {
  const qs = new URLSearchParams();
  if (params?.page) qs.set('page', String(params.page));
  if (params?.pageSize) qs.set('pageSize', String(params.pageSize));
  const query = qs.toString();
  return apiFetch<PaginatedResponse<ProjectDto>>(`/projects${query ? `?${query}` : ''}`);
},
```

Apply the same pattern to `test-plans.ts`, `test-runs.ts`, `defects.ts`, `users.ts`, `shared-steps.ts`.

- [ ] **Step 3: Update frontend hooks**

Update each `useProjects`, `useTestPlans`, `useTestRuns`, `useDefects`, `useUsers`, `useSharedSteps` hook to accept optional `page`/`pageSize` params and pass them through. Update return type expectations for paginated response.

- [ ] **Step 4: Update frontend pages to use Pagination**

For each list page (projects, plans, runs, defects, users, shared-steps), add pagination state and the `<Pagination>` component:

```tsx
const [page, setPage] = useState(1);
const { data: response, isLoading } = useProjects({ page, pageSize: 20 });

// Access data:
const projects = response?.data ?? [];
const totalPages = response?.totalPages ?? 1;

// At the bottom of the list:
<Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
```

- [ ] **Step 5: Run full typecheck**

Run: `pnpm typecheck`
Expected: no errors

- [ ] **Step 6: Commit frontend pagination**

```bash
git add apps/frontend/components/shared/Pagination.tsx apps/frontend/lib/api/ apps/frontend/lib/ "apps/frontend/app/(dashboard)/"
git commit -m "feat(frontend): add pagination controls to all list pages

Create shared Pagination component. Update API clients and hooks
to accept page/pageSize params. Add pagination to projects, plans,
runs, defects, users, and shared-steps pages.

Closes #64"
```

---

## Final Verification

- [ ] **Step 1: Run full test suite**

Run: `pnpm test`
Expected: all tests pass

- [ ] **Step 2: Run full typecheck**

Run: `pnpm typecheck`
Expected: no errors

- [ ] **Step 3: Run lint**

Run: `pnpm lint`
Expected: no errors

- [ ] **Step 4: Verify all oversized files are under 300 lines**

Run: `wc -l apps/frontend/components/test-cases/CaseEditor.tsx apps/frontend/components/test-cases/CsvImportWizard.tsx "apps/frontend/app/(dashboard)/projects/[id]/cases/page.tsx"`

Expected: all under 300 lines
