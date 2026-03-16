'use client';

import { useState } from 'react';
import { ChevronRight, FolderOpen, Folder } from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { cn } from '@/lib/utils';
import type { TreeNode } from '@/lib/test-suites/tree-utils';

interface SuiteTreeProps {
  tree: TreeNode[];
  selectedId?: string | null;
  onSelect?: (suiteId: string) => void;
  onCreateChild: (parentId: string) => void;
  onRename: (node: TreeNode) => void;
  onDelete: (node: TreeNode) => void;
}

export function SuiteTree({ tree, selectedId, onSelect, onCreateChild, onRename, onDelete }: SuiteTreeProps) {
  if (tree.length === 0) {
    return (
      <div className="flex flex-col items-center px-3 py-8 text-center">
        <div className="mb-2 flex size-8 items-center justify-center rounded-full bg-muted">
          <FolderOpen className="size-4 text-muted-foreground" />
        </div>
        <p className="text-[13px] text-muted-foreground">
          No suites yet.
        </p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          Use the button above to create one.
        </p>
      </div>
    );
  }

  return (
    <ul role="tree" className="space-y-0.5 py-1">
      {tree.map((node) => (
        <SuiteTreeNode
          key={node.id}
          node={node}
          depth={0}
          selectedId={selectedId}
          onSelect={onSelect}
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
  selectedId?: string | null;
  onSelect?: (suiteId: string) => void;
  onCreateChild: (parentId: string) => void;
  onRename: (node: TreeNode) => void;
  onDelete: (node: TreeNode) => void;
}

function SuiteTreeNode({ node, depth, selectedId, onSelect, onCreateChild, onRename, onDelete }: SuiteTreeNodeProps) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children.length > 0;
  const isSelected = selectedId === node.id;

  return (
    <li role="treeitem">
      <ContextMenu>
        <ContextMenuTrigger>
          <div
            className={cn(
              'group flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[13px] transition-colors',
              isSelected
                ? 'bg-primary/10 font-semibold text-primary'
                : 'text-foreground/80 hover:bg-accent cursor-pointer',
            )}
            style={{ paddingLeft: `${depth * 16 + 8}px` }}
          >
            {/* Expand/collapse chevron */}
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded(!expanded);
                }}
                className="flex size-5 shrink-0 cursor-pointer items-center justify-center rounded transition-colors hover:bg-muted"
                aria-label={`Toggle ${node.name}`}
              >
                <ChevronRight
                  className={cn(
                    'size-3.5 transition-transform duration-150',
                    expanded && 'rotate-90',
                  )}
                />
              </button>
            ) : (
              <span className="size-5 shrink-0" />
            )}

            {/* Folder icon */}
            {expanded && hasChildren ? (
              <FolderOpen className={cn('size-4 shrink-0', isSelected ? 'text-primary' : 'text-muted-foreground')} />
            ) : (
              <Folder className={cn('size-4 shrink-0', isSelected ? 'text-primary' : 'text-muted-foreground')} />
            )}

            {/* Suite name */}
            <button
              type="button"
              className="cursor-pointer truncate text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded"
              onClick={(e) => {
                e.stopPropagation();
                onSelect?.(node.id);
              }}
            >
              {node.name}
            </button>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={() => onCreateChild(node.id)} className="cursor-pointer">
            Add child suite
          </ContextMenuItem>
          <ContextMenuItem onClick={() => onRename(node)} className="cursor-pointer">
            Rename
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => onDelete(node)}
            className="cursor-pointer text-destructive focus:text-destructive"
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
              selectedId={selectedId}
              onSelect={onSelect}
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
