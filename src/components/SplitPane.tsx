import * as React from 'react';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/hooks/useMediaQuery';

export interface SplitPaneProps {
  /**
   * Exactly two children: the first becomes the left pane, the second the right pane.
   * Using children (rather than `left`/`right` props) lets callers compose toolbar
   * slots, copy buttons, and upload overlays naturally inside each pane.
   */
  children: [React.ReactNode, React.ReactNode];
  /** Accessible label for the left panel */
  leftLabel?: string;
  /** Accessible label for the right panel */
  rightLabel?: string;
  className?: string;
  /** Initial split percentage (20–80). Defaults to 50. */
  defaultSplit?: number;
}

/**
 * Resizable split pane — left (input) and right (output) side by side on desktop,
 * stacked vertically on mobile (below md breakpoint).
 *
 * Drag the handle or use ArrowLeft/ArrowRight keys to resize (desktop only).
 * No external library — keeps bundle lean and avoids SSR hydration mismatches.
 */
export function SplitPane({
  children,
  leftLabel = 'Input',
  rightLabel = 'Output',
  className,
  defaultSplit = 50,
}: SplitPaneProps) {
  const [left, right] = children;
  const containerRef = React.useRef<HTMLDivElement>(null);
  const isDragging = React.useRef(false);
  const [splitPct, setSplitPct] = React.useState(defaultSplit);
  const isMobile = useMediaQuery('(max-width: 767px)');

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
      if (e.touches[0]) {
        handleMove(e.touches[0].clientX);
      }
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

  if (isMobile) {
    return (
      <div
        className={cn('flex h-full min-h-0 w-full flex-col overflow-hidden', className)}
        role="group"
      >
        <section className="flex min-h-0 flex-1 flex-col overflow-hidden" aria-label={leftLabel}>
          {left}
        </section>
        <div className="h-px w-full shrink-0 bg-edge" aria-hidden="true" />
        <section className="flex min-h-0 flex-1 flex-col overflow-hidden" aria-label={rightLabel}>
          {right}
        </section>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn('flex h-full min-h-0 w-full overflow-hidden', className)}
      role="group"
    >
      {/* Left pane */}
      <section
        className="flex h-full min-w-0 flex-col overflow-hidden"
        style={{ width: `${String(splitPct)}%` }}
        aria-label={leftLabel}
      >
        {left}
      </section>

      {/* Drag handle — role="slider" makes keyboard/pointer interactions semantically valid */}
      <button
        type="button"
        role="slider"
        aria-label="Resize panels"
        aria-orientation="vertical"
        aria-valuenow={splitPct}
        aria-valuemin={20}
        aria-valuemax={80}
        className="group relative flex w-1 shrink-0 cursor-col-resize items-center justify-center bg-surface-elevated transition-colors hover:bg-accent-600/60 focus-visible:bg-accent-600/60 focus-visible:outline-none"
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') {
            setSplitPct((p) => Math.max(20, p - 1));
          }
          if (e.key === 'ArrowRight') {
            setSplitPct((p) => Math.min(80, p + 1));
          }
        }}
      >
        {/* Visual grip dots */}
        <div className="flex flex-col gap-0.5 opacity-40 group-hover:opacity-70">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-1 w-1 rounded-full bg-fg-secondary" aria-hidden="true" />
          ))}
        </div>
      </button>

      {/* Right pane */}
      <section
        className="flex h-full min-w-0 flex-col overflow-hidden"
        style={{ width: `${String(100 - splitPct)}%` }}
        aria-label={rightLabel}
      >
        {right}
      </section>
    </div>
  );
}
