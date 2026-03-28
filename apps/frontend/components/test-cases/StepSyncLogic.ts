import type { TestCaseStepDto } from '@app/shared';
import { testCasesApi } from '@/lib/api/test-cases';
import type { StepData } from './StepEditor';

/**
 * Syncs the local step state with the backend by diffing against original steps.
 * Handles deleting removed steps, creating new ones, updating changed ones,
 * and reordering the final list.
 */
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
      // Update existing step
      const orig = originalSteps.find((o) => o.id === step.id);
      if (orig && (orig.description !== step.description || orig.expectedResult !== step.expectedResult)) {
        await testCasesApi.updateStep(projectId, caseId, step.id, {
          description: step.description,
          expectedResult: step.expectedResult,
        });
      }
    } else {
      // Create new step
      await testCasesApi.createStep(projectId, caseId, {
        description: step.description || 'New step',
        expectedResult: step.expectedResult || 'Expected result',
      });
    }
  }

  // Reorder if needed (get fresh step ids after creates)
  const freshSteps = await testCasesApi.listSteps(projectId, caseId);
  if (freshSteps.length > 1) {
    // Build desired order based on current step descriptions
    const orderedIds = steps
      .map((s) => {
        if (s.id && freshSteps.some((fs) => fs.id === s.id)) return s.id;
        // For newly created steps, match by description
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
