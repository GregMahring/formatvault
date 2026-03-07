import { memo, useCallback, useState } from 'react';
import { ChevronRight, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type ValueType, formatValuePreview } from '@/lib/treeUtils';

export interface TreeNodeProps {
  nodeKey: string;
  value: unknown;
  type: ValueType;
  path: string;
  depth: number;
  childCount: number;
  isArrayIndex: boolean;
  isExpanded: boolean;
  searchMatch: boolean;
  onToggle: (path: string) => void;
  onCopyPath: (path: string) => void;
}

const TYPE_COLORS: Record<ValueType, string> = {
  string: 'text-green-400',
  number: 'text-cyan-400',
  boolean: 'text-yellow-400',
  null: 'text-fg-tertiary',
  object: 'text-fg-secondary',
  array: 'text-fg-secondary',
};

const TYPE_BADGES: Record<ValueType, string> = {
  string: 'bg-green-900/30 text-green-500',
  number: 'bg-cyan-900/30 text-cyan-500',
  boolean: 'bg-yellow-900/30 text-yellow-500',
  null: 'bg-surface-elevated text-fg-muted',
  object: 'bg-purple-900/30 text-purple-500',
  array: 'bg-blue-900/30 text-blue-500',
};

export const TreeNodeComponent = memo(function TreeNodeComponent({
  nodeKey,
  value,
  type,
  path,
  depth,
  childCount,
  isArrayIndex,
  isExpanded,
  searchMatch,
  onToggle,
  onCopyPath,
}: TreeNodeProps) {
  const [copied, setCopied] = useState(false);
  const hasChildren = childCount > 0;
  const isContainer = type === 'object' || type === 'array';

  const handleToggle = useCallback(() => {
    if (hasChildren) onToggle(path);
  }, [hasChildren, onToggle, path]);

  const handleCopy = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onCopyPath(path);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 1500);
    },
    [onCopyPath, path]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleToggle();
      }
    },
    [handleToggle]
  );

  return (
    <div
      className={cn(
        'group flex items-center gap-1 border-b border-gray-900/50 py-0.5 pr-2 text-xs hover:bg-surface-elevated/40',
        searchMatch && 'bg-accent-900/20'
      )}
      style={{ paddingLeft: `${String(depth * 16 + 8)}px` }}
      role="treeitem"
      aria-selected={false}
      aria-expanded={hasChildren ? isExpanded : undefined}
      tabIndex={0}
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
    >
      {/* Expand/collapse chevron */}
      <span className="flex h-4 w-4 shrink-0 items-center justify-center">
        {hasChildren ? (
          <ChevronRight
            className={cn('h-3 w-3 text-fg-muted transition-transform', isExpanded && 'rotate-90')}
            aria-hidden="true"
          />
        ) : null}
      </span>

      {/* Key */}
      <span
        className={cn('shrink-0 font-mono', isArrayIndex ? 'text-fg-tertiary' : 'text-gray-300')}
      >
        {isArrayIndex ? `[${nodeKey}]` : nodeKey}
      </span>

      <span className="shrink-0 text-gray-700" aria-hidden="true">
        :
      </span>

      {/* Value preview */}
      {isContainer ? (
        <span className="truncate text-fg-tertiary">
          {type === 'array' ? `[${String(childCount)}]` : `{${String(childCount)}}`}
        </span>
      ) : (
        <span className={cn('truncate font-mono', TYPE_COLORS[type])}>
          {formatValuePreview(value, 120)}
        </span>
      )}

      {/* Type badge */}
      <span
        className={cn(
          'ml-auto shrink-0 rounded px-1 py-0 text-[10px] leading-4 opacity-0 transition-opacity group-hover:opacity-100',
          TYPE_BADGES[type]
        )}
      >
        {type}
      </span>

      {/* Copy path button */}
      <button
        type="button"
        className="shrink-0 rounded p-0.5 text-gray-700 opacity-0 transition-opacity hover:bg-gray-700 hover:text-fg-secondary group-hover:opacity-100"
        onClick={handleCopy}
        title={`Copy path: ${path}`}
        aria-label={`Copy path ${path}`}
      >
        {copied ? (
          <Check className="h-3 w-3 text-green-500" aria-hidden="true" />
        ) : (
          <Copy className="h-3 w-3" aria-hidden="true" />
        )}
      </button>
    </div>
  );
});
