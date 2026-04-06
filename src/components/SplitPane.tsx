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
 * Layout is CSS-first (`flex-col md:flex-row`) to avoid CLS: the stacked mobile
 * layout renders correctly before JS hydrates. JS only controls the drag-resize
 * widths on desktop.
 *
 * Drag the handle or use ArrowLeft/ArrowRight keys to resize (desktop only).
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
  // isMobile is only used to suppress inline resize widths, not to toggle layout.
  // The layout itself is handled by flex-col / md:flex-row CSS classes.
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
      className={cn('flex h-full min-h-0 w-full flex-col overflow-hidden md:flex-row', className)}
      role="group"
    >
      {/* Left pane — flex-1 on mobile (equal halves), explicit width on desktop */}
      <section
        className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-none"
        style={isMobile ? undefined : { width: `${String(splitPct)}%` }}
        aria-label={leftLabel}
      >
        {left}
      </section>

      {/* Mobile: thin horizontal divider between panes */}
      <div className="h-px w-full shrink-0 bg-edge md:hidden" aria-hidden="true" />

      {/* Desktop-only drag handle */}
      <button
        type="button"
        role="slider"
        aria-label="Resize panels"
        aria-orientation="vertical"
        aria-valuenow={splitPct}
        aria-valuemin={20}
        aria-valuemax={80}
        className="group relative hidden w-1 shrink-0 cursor-col-resize items-center justify-center bg-surface-elevated transition-colors hover:bg-accent-600/60 focus-visible:bg-accent-600/60 focus-visible:outline-none md:flex"
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') setSplitPct((p) => Math.max(20, p - 1));
          if (e.key === 'ArrowRight') setSplitPct((p) => Math.min(80, p + 1));
        }}
      >
        <div className="flex flex-col gap-0.5 opacity-40 group-hover:opacity-70">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-1 w-1 rounded-full bg-fg-secondary" aria-hidden="true" />
          ))}
        </div>
      </button>

      {/* Right pane */}
      <section
        className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-none"
        style={isMobile ? undefined : { width: `${String(100 - splitPct)}%` }}
        aria-label={rightLabel}
      >
        {right}
      </section>
    </div>
  );
}
