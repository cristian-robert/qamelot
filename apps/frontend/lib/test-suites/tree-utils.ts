import type { TestSuiteDto } from '@app/shared';

export interface SuiteTreeNode extends TestSuiteDto {
  children: SuiteTreeNode[];
}

export function buildSuiteTree(suites: TestSuiteDto[]): SuiteTreeNode[] {
  const map = new Map<string, SuiteTreeNode>();
  const roots: SuiteTreeNode[] = [];

  for (const suite of suites) {
    map.set(suite.id, { ...suite, children: [] });
  }

  for (const suite of suites) {
    const node = map.get(suite.id)!;
    if (suite.parentId && map.has(suite.parentId)) {
      map.get(suite.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}
