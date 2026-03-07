import { useCallback, useMemo } from 'react';
import { Search, ChevronsDownUp, ChevronsUpDown, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { flattenTree } from '@/lib/treeUtils';
import { useTreeState } from '@/hooks/useTreeState';
import { TreeNodeComponent } from './TreeNode';

export interface TreeViewProps {
  /** The parsed JSON/YAML data to visualize */
  data: unknown;
  className?: string;
}

const MAX_RENDERABLE_NODES = 10000;

export function TreeView({ data, className }: TreeViewProps) {
  const tree = useTreeState(data);

  const nodes = useMemo(() => flattenTree(data, tree.expandedPaths), [data, tree.expandedPaths]);

  const handleCopyPath = useCallback((path: string) => {
    void navigator.clipboard.writeText(path);
  }, []);

  const isTooLarge = tree.totalNodes > MAX_RENDERABLE_NODES;

  return (
    <div className={cn('flex h-full flex-col', className)}>
      {/* Header: search + controls */}
      <div className="flex items-center gap-2 border-b border-edge px-3 py-1.5">
        <div className="relative flex-1">
          <Search
            className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-fg-muted"
            aria-hidden="true"
          />
          <input
            type="text"
            value={tree.searchQuery}
            onChange={(e) => {
              tree.setSearchQuery(e.target.value);
            }}
            placeholder="Search keys and values..."
            className="w-full rounded border border-edge-emphasis bg-surface-raised py-1 pl-7 pr-2 text-xs text-gray-200 placeholder:text-fg-muted focus:border-accent-500 focus:outline-none"
            aria-label="Search tree"
          />
        </div>

        <button
          type="button"
          onClick={tree.expandAll}
          className="rounded p-1 text-fg-muted hover:bg-surface-elevated hover:text-fg-secondary"
          title="Expand all"
          aria-label="Expand all nodes"
        >
          <ChevronsUpDown className="h-3.5 w-3.5" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={tree.collapseAll}
          className="rounded p-1 text-fg-muted hover:bg-surface-elevated hover:text-fg-secondary"
          title="Collapse all"
          aria-label="Collapse all nodes"
        >
          <ChevronsDownUp className="h-3.5 w-3.5" aria-hidden="true" />
        </button>

        <span className="text-[10px] text-fg-muted">{String(tree.totalNodes)} nodes</span>
      </div>

      {/* Warning for very large trees */}
      {isTooLarge && (
        <div className="flex items-center gap-2 border-b border-yellow-900/40 bg-yellow-950/30 px-3 py-1.5 text-xs text-yellow-400">
          <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden="true" />
          <span>
            This document has {String(tree.totalNodes)} nodes. Performance may be degraded. Consider
            collapsing sections you don't need.
          </span>
        </div>
      )}

      {/* Search results info */}
      {tree.isSearching && (
        <div className="border-b border-edge bg-surface-raised/50 px-3 py-1 text-[11px] text-fg-secondary">
          {tree.matchingPaths.size > 0
            ? `${String(tree.matchingPaths.size)} matches`
            : 'No matches'}
        </div>
      )}

      {/* Tree body */}
      <div className="flex-1 overflow-auto" role="tree" aria-label="Data tree view">
        {nodes.map((node) => (
          <TreeNodeComponent
            key={node.path}
            nodeKey={node.key}
            value={node.value}
            type={node.type}
            path={node.path}
            depth={node.depth}
            childCount={node.childCount}
            isArrayIndex={node.isArrayIndex}
            isExpanded={tree.expandedPaths.has(node.path)}
            searchMatch={tree.isSearching && tree.matchingPaths.has(node.path)}
            onToggle={tree.toggleNode}
            onCopyPath={handleCopyPath}
          />
        ))}
      </div>
    </div>
  );
}
