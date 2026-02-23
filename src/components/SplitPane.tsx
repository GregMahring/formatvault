import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SplitPaneProps {
  /** Left panel content — typically the input editor */
  left: React.ReactNode;
  /** Right panel content — typically the output editor */
  right: React.ReactNode;
  /** Optional label for the left panel (accessibility) */
  leftLabel?: string;
  /** Optional label for the right panel (accessibility) */
  rightLabel?: string;
  className?: string;
}

/**
 * Resizable split pane — left (input) and right (output) side by side.
 *
 * Uses a CSS Grid layout with a draggable divider. The split ratio is stored
 * in a CSS custom property on the element so it survives re-renders without
 * React state churn.
 *
 * No external library — keeps bundle lean and avoids SSR hydration mismatches.
 */
export function SplitPane({
  left,
  right,
  leftLabel = 'Input',
  rightLabel = 'Output',
  className,
}: SplitPaneProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const isDragging = React.useRef(false);
  const [splitPct, setSplitPct] = React.useState(50);

  const handleDragStart = React.useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  React.useEffect(() => {
    const handleMove = (clientX: number) => {
      if (!isDragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = Math.min(80, Math.max(20, ((clientX - rect.left) / rect.width) * 100));
      setSplitPct(pct);
    };

    const onMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX);
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) handleMove(e.touches[0].clientX);
    };
    const onEnd = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onEnd);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn('flex h-full min-h-0 w-full overflow-hidden', className)}
      role="group"
    >
      {/* Left pane */}
      <section
        className="flex min-w-0 flex-col overflow-hidden"
        style={{ width: `${String(splitPct)}%` }}
        aria-label={leftLabel}
      >
        {left}
      </section>

      {/* Drag handle — uses role="slider" so keyboard/pointer interactions are semantically valid */}
      <button
        type="button"
        role="slider"
        aria-label="Resize panels"
        aria-orientation="vertical"
        aria-valuenow={splitPct}
        aria-valuemin={20}
        aria-valuemax={80}
        className="group relative flex w-1 shrink-0 cursor-col-resize items-center justify-center bg-gray-800 transition-colors hover:bg-accent-600/60 focus-visible:bg-accent-600/60 focus-visible:outline-none"
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        onKeyDown={(e) => {
          // Allow keyboard resizing with arrow keys
          if (e.key === 'ArrowLeft') {
            setSplitPct((p) => Math.max(20, p - 1));
          }
          if (e.key === 'ArrowRight') {
            setSplitPct((p) => Math.min(80, p + 1));
          }
        }}
      >
        {/* Visual grip indicator */}
        <div className="flex flex-col gap-0.5 opacity-40 group-hover:opacity-70">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-1 w-1 rounded-full bg-gray-400" aria-hidden="true" />
          ))}
        </div>
      </button>

      {/* Right pane */}
      <section
        className="flex min-w-0 flex-col overflow-hidden"
        style={{ width: `${String(100 - splitPct)}%` }}
        aria-label={rightLabel}
      >
        {right}
      </section>
    </div>
  );
}
