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
 * The handle follows the ARIA window-splitter pattern (desktop only): drag it, click or
 * tap it without dragging to cycle 50% → 70% → 30% (the single-pointer alternative
 * WCAG 2.5.7 requires), or use ArrowLeft/ArrowRight (1%), PageUp/PageDown (10%),
 * Home/End (limits) and Enter (reset to 50%).
 */

const MIN_SPLIT = 20;
const MAX_SPLIT = 80;
const CLICK_PRESETS = [50, 70, 30];

const clampSplit = (pct: number) => Math.min(MAX_SPLIT, Math.max(MIN_SPLIT, pct));

/** The preset after the one the split is closest to, so repeated clicks cycle. */
function nextPreset(pct: number): number {
  const nearest = CLICK_PRESETS.reduce((a, b) => (Math.abs(b - pct) < Math.abs(a - pct) ? b : a));
  return CLICK_PRESETS[(CLICK_PRESETS.indexOf(nearest) + 1) % CLICK_PRESETS.length] ?? 50;
}
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
  // Distinguishes a click/tap (cycle presets) from a drag when the pointer is released
  const didMove = React.useRef(false);
  const [splitPct, setSplitPct] = React.useState(defaultSplit);
  // isMobile is only used to suppress inline resize widths, not to toggle layout.
  // The layout itself is handled by flex-col / md:flex-row CSS classes.
  const isMobile = useMediaQuery('(max-width: 767px)');

  const handleDragStart = React.useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    isDragging.current = true;
    didMove.current = false;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  React.useEffect(() => {
    const handleMove = (clientX: number) => {
      if (!isDragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      didMove.current = true;
      setSplitPct(clampSplit(((clientX - rect.left) / rect.width) * 100));
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
      // Released without moving: treat as a click. Handled here rather than onClick
      // because preventDefault on touchstart suppresses the click on touch devices.
      if (!didMove.current) setSplitPct(nextPreset);
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

      {/* Desktop-only resize handle (ARIA window splitter). The element is 24px wide for
          the WCAG 2.5.8 target size, and -mr-5 keeps its layout footprint at 4px. The extra
          width overlaps only the right pane (its line-number gutter): overlapping the left
          pane would cover that editor's scrollbar. z-10 keeps it above the right pane. */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- a focusable separator with aria-valuenow is an interactive widget in ARIA 1.2 (APG window splitter); jsx-a11y classes every separator as static */}
      <div
        role="separator"
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- see above: the window-splitter pattern requires the separator to be focusable
        tabIndex={0}
        aria-label="Resize panels"
        aria-orientation="vertical"
        aria-valuenow={Math.round(splitPct)}
        aria-valuemin={MIN_SPLIT}
        aria-valuemax={MAX_SPLIT}
        aria-valuetext={`Left panel ${String(Math.round(splitPct))}%`}
        className="group relative z-10 -mr-5 hidden w-6 shrink-0 cursor-col-resize items-center justify-center focus-visible:outline-none md:flex"
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        onKeyDown={(e) => {
          const step: Record<string, (p: number) => number> = {
            ArrowLeft: (p) => p - 1,
            ArrowRight: (p) => p + 1,
            PageUp: (p) => p - 10,
            PageDown: (p) => p + 10,
            Home: () => MIN_SPLIT,
            End: () => MAX_SPLIT,
            Enter: () => 50,
          };
          const move = step[e.key];
          if (!move) return;
          e.preventDefault();
          setSplitPct((p) => clampSplit(move(Math.round(p))));
        }}
      >
        <div
          className="absolute inset-y-0 left-0 w-1 bg-surface-elevated transition-colors group-hover:bg-accent-600/60 group-focus-visible:bg-accent-600/60"
          aria-hidden="true"
        />
        <div className="relative mr-auto flex flex-col gap-0.5 opacity-40 group-hover:opacity-70">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-1 w-1 rounded-full bg-fg-secondary" aria-hidden="true" />
          ))}
        </div>
      </div>

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
