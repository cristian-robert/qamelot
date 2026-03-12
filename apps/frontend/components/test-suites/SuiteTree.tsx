'use client';

import { useState } from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import type { TreeNode } from '@/lib/test-suites/tree-utils';

interface SuiteTreeProps {
  tree: TreeNode[];
  onCreateChild: (parentId: string) => void;
  onRename: (node: TreeNode) => void;
  onDelete: (node: TreeNode) => void;
}

export function SuiteTree({ tree, onCreateChild, onRename, onDelete }: SuiteTreeProps) {
  if (tree.length === 0) {
    return (
      <p className="px-3 py-4 text-sm text-muted-foreground">
        No suites yet. Right-click to create one.
      </p>
    );
  }

  return (
    <ul role="tree" className="space-y-0.5 py-1">
      {tree.map((node) => (
        <SuiteTreeNode
          key={node.id}
          node={node}
          depth={0}
          onCreateChild={onCreateChild}
          onRename={onRename}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}

interface SuiteTreeNodeProps {
  node: TreeNode;
  depth: number;
  onCreateChild: (parentId: string) => void;
  onRename: (node: TreeNode) => void;
  onDelete: (node: TreeNode) => void;
}

function SuiteTreeNode({ node, depth, onCreateChild, onRename, onDelete }: SuiteTreeNodeProps) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children.length > 0;

  return (
    <li role="treeitem">
      <ContextMenu>
        <ContextMenuTrigger>
          <div
            className="flex items-center gap-1 rounded px-2 py-1 text-sm hover:bg-accent cursor-pointer"
            style={{ paddingLeft: `${depth * 16 + 8}px` }}
          >
            {hasChildren ? (
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded hover:bg-muted"
                aria-label={`Toggle ${node.name}`}
              >
                <span className={`text-xs transition-transform ${expanded ? 'rotate-90' : ''}`}>
                  ▶
                </span>
              </button>
            ) : (
              <span className="h-5 w-5 shrink-0" />
            )}
            <span className="truncate">{node.name}</span>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={() => onCreateChild(node.id)}>
            Add child suite
          </ContextMenuItem>
          <ContextMenuItem onClick={() => onRename(node)}>
            Rename
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => onDelete(node)}
            className="text-destructive"
          >
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {hasChildren && expanded && (
        <ul role="group" className="space-y-0.5">
          {node.children.map((child) => (
            <SuiteTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              onCreateChild={onCreateChild}
              onRename={onRename}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
