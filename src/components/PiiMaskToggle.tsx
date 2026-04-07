import { EyeOff, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PiiMaskingState } from '@/hooks/usePiiMasking';
import type { PiiCategory } from '@/lib/piiMasker';

export interface PiiMaskToggleProps {
  pii: PiiMaskingState;
  className?: string;
}

/** Human-readable labels for each PII category */
const CATEGORY_LABELS: Record<PiiCategory, string> = {
  EMAIL: 'Emails',
  IP: 'IP addresses',
  PHONE: 'Phone numbers',
  KEY: 'API keys',
  AWS_KEY: 'AWS keys',
  CC: 'Credit cards',
  UUID: 'UUIDs',
  SSN: 'SSNs',
  IBAN: 'IBANs',
  DOB: 'Dates of birth',
  DL: "Driver's licenses",
  PASSPORT: 'Passport numbers',
};

/**
 * Compact toggle button to enable/disable PII masking on output content.
 * Shows match count when masking is active.
 */
export function PiiMaskToggle({ pii, className }: PiiMaskToggleProps) {
  const Icon = pii.enabled ? EyeOff : Eye;

  // Build tooltip showing breakdown by category
  const tooltipLines: string[] = [];
  if (pii.enabled && pii.matchCount > 0) {
    for (const [cat, count] of Object.entries(pii.summary)) {
      const label = CATEGORY_LABELS[cat as PiiCategory];
      tooltipLines.push(`${label}: ${String(count)}`);
    }
  }
  const tooltip = pii.enabled
    ? pii.matchCount > 0
      ? `PII masked (${String(pii.matchCount)} found)\n${tooltipLines.join('\n')}`
      : 'PII masking on (none found)'
    : 'Mask PII in output';

  return (
    <button
      type="button"
      onClick={() => {
        pii.setEnabled(!pii.enabled);
      }}
      className={cn(
        'flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] transition-colors',
        pii.enabled
          ? 'bg-amber-900/40 text-amber-400 hover:bg-amber-900/60'
          : 'text-fg-secondary hover:bg-surface-elevated hover:text-fg',
        className
      )}
      aria-pressed={pii.enabled}
      title={tooltip}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      <span>Mask PII</span>
      {pii.enabled && pii.matchCount > 0 && (
        <span className="ml-0.5 rounded-full bg-amber-800/60 px-1.5 py-px text-[9px] font-semibold tabular-nums text-amber-300">
          {String(pii.matchCount)}
        </span>
      )}
    </button>
  );
}
