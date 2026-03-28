import { cn } from '@/lib/utils';

export interface AdSidebarProps {
  side: 'left' | 'right';
  className?: string;
}

/**
 * Persistent ad sidebar shown on all tool pages (formatters, converters, utilities).
 * Hidden on mobile/tablet — only rendered at lg breakpoint and above.
 *
 * Each sidebar contains two ad slot placeholders. Drop ad network scripts into
 * the inner divs with the `data-ad-slot` attribute when ready.
 */
export function AdSidebar({ side, className }: AdSidebarProps) {
  return (
    <aside
      aria-label="Advertisements"
      className={cn(
        'hidden lg:flex',
        'w-40 shrink-0 flex-col gap-4 px-3 py-4',
        'border-edge bg-surface',
        side === 'left' ? 'border-r' : 'border-l',
        className
      )}
    >
      <AdSlot id={`ad-${side}-1`} />
      <AdSlot id={`ad-${side}-2`} />
    </aside>
  );
}

interface AdSlotProps {
  id: string;
}

function AdSlot({ id }: AdSlotProps) {
  // In production, render only the container div for the ad network to inject into.
  // The placeholder label and dashed border are dev-only visual aids.
  const isProd = (import.meta.env as Record<string, unknown>).PROD === true;

  if (isProd) {
    return <div id={id} data-ad-slot={id} className="h-[130px] w-full" aria-hidden="true" />;
  }

  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="text-[10px] uppercase tracking-widest text-fg-secondary">Ad slot</span>
      <div
        id={id}
        data-ad-slot={id}
        className="flex h-[130px] w-full items-center justify-center rounded border border-dashed border-edge-emphasis bg-surface-raised"
        aria-hidden="true"
      />
    </div>
  );
}
