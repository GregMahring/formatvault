import { useMemo, useState } from 'react';
import * as Diff from 'diff';
import { cn } from '@/lib/utils';

export interface DiffPanelProps {
  /** Original / "before" text */
  original: string;
  /** Modified / "after" text */
  modified: string;
  className?: string;
}

type DiffLine =
  | { kind: 'added'; text: string; lineNum: number }
  | { kind: 'removed'; text: string; lineNum: number }
  | { kind: 'unchanged'; text: string; lineNum: number };

function buildDiffLines(original: string, modified: string): DiffLine[] {
  const changes = Diff.diffLines(original, modified);
  const lines: DiffLine[] = [];
  let origLine = 1;
  let modLine = 1;

  for (const change of changes) {
    const parts = change.value.split('\n');
    // diffLines includes a trailing empty string if the chunk ends with \n
    const linesInChange = parts[parts.length - 1] === '' ? parts.slice(0, -1) : parts;

    for (const text of linesInChange) {
      if (change.added) {
        lines.push({ kind: 'added', text, lineNum: modLine++ });
      } else if (change.removed) {
        lines.push({ kind: 'removed', text, lineNum: origLine++ });
      } else {
        lines.push({ kind: 'unchanged', text, lineNum: origLine });
        origLine++;
        modLine++;
      }
    }
  }
  return lines;
}

/**
 * In-page diff panel — shows a unified line-by-line diff of two text inputs.
 * Uses the `diff` library (pure JS, no external binaries).
 *
 * Renders a compact summary strip (X added, Y removed) plus a scrollable diff view.
 * Not a route — toggled in-page on formatter pages.
 */
export function DiffPanel({ original, modified, className }: DiffPanelProps) {
  const [showContext, setShowContext] = useState(true);

  const lines = useMemo(() => buildDiffLines(original, modified), [original, modified]);

  const added = lines.filter((l) => l.kind === 'added').length;
  const removed = lines.filter((l) => l.kind === 'removed').length;
  const unchanged = lines.filter((l) => l.kind === 'unchanged').length;
  const hasChanges = added > 0 || removed > 0;

  const visibleLines = showContext ? lines : lines.filter((l) => l.kind !== 'unchanged');

  if (!original && !modified) {
    return (
      <div className={cn('flex items-center justify-center p-8 text-xs text-fg-muted', className)}>
        Diff will appear here once both panes have content.
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col overflow-hidden', className)}>
      {/* Summary bar */}
      <div className="flex items-center gap-3 border-b border-edge px-4 py-1.5 text-xs">
        {hasChanges ? (
          <>
            {added > 0 && <span className="text-green-400">+{String(added)} added</span>}
            {removed > 0 && <span className="text-red-400">−{String(removed)} removed</span>}
            <span className="text-fg-muted">{String(unchanged)} unchanged</span>
          </>
        ) : (
          <span className="text-fg-tertiary">No differences</span>
        )}
        <div className="flex-1" />
        <label className="flex cursor-pointer items-center gap-1.5 text-fg-tertiary">
          <input
            type="checkbox"
            className="h-3 w-3 accent-accent-500"
            checked={showContext}
            onChange={(e) => {
              setShowContext(e.target.checked);
            }}
          />
          Show context
        </label>
      </div>

      {/* Diff lines */}
      <div className="flex-1 overflow-auto">
        <table className="w-full font-mono text-xs" aria-label="Diff output">
          <tbody>
            {visibleLines.map((line, idx) => (
              <tr
                key={idx}
                className={cn(
                  'border-b border-gray-900',
                  line.kind === 'added' && 'bg-green-950/40',
                  line.kind === 'removed' && 'bg-red-950/40'
                )}
              >
                {/* Gutter */}
                <td className="w-8 select-none px-2 text-right text-gray-700">
                  {String(line.lineNum)}
                </td>
                {/* Change marker */}
                <td
                  className={cn(
                    'w-4 select-none text-center',
                    line.kind === 'added' && 'text-green-500',
                    line.kind === 'removed' && 'text-red-500',
                    line.kind === 'unchanged' && 'text-gray-700'
                  )}
                >
                  {line.kind === 'added' ? '+' : line.kind === 'removed' ? '−' : ' '}
                </td>
                {/* Content */}
                <td
                  className={cn(
                    'px-2 py-0.5 whitespace-pre',
                    line.kind === 'added' && 'text-green-300',
                    line.kind === 'removed' && 'text-red-300',
                    line.kind === 'unchanged' && 'text-fg-tertiary'
                  )}
                >
                  {line.text || ' '}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {visibleLines.length === 0 && (
          <div className="p-4 text-center text-xs text-fg-muted">
            {showContext ? 'Empty diff' : 'No changes — enable "Show context" to see all lines'}
          </div>
        )}
      </div>
    </div>
  );
}
