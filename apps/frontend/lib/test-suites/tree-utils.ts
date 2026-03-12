import type { TestSuiteDto } from '@app/shared';

export interface TreeNode extends TestSuiteDto {
  children: TreeNode[];
}

export function buildTree(suites: TestSuiteDto[]): TreeNode[] {
  const map = new Map<string, TreeNode>();

  for (const suite of suites) {
    map.set(suite.id, { ...suite, children: [] });
  }

  const roots: TreeNode[] = [];

  for (const node of map.values()) {
    if (node.parentId && map.has(node.parentId)) {
      map.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortByName = (a: TreeNode, b: TreeNode) => a.name.localeCompare(b.name);

  function sortRecursive(nodes: TreeNode[]) {
    nodes.sort(sortByName);
    for (const node of nodes) {
      sortRecursive(node.children);
    }
  }

  sortRecursive(roots);
  return roots;
}
