import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { type CronExpression } from '@/features/tools/cronExplainer';
import { Copy, Check } from 'lucide-react';

// ── Date formatting ───────────────────────────────────────────────────────────

const localFormatter = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  timeZoneName: 'short',
});

const relativeFormatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

function formatRelative(date: Date): string {
  const diffMs = date.getTime() - Date.now();
  const abs = Math.abs(diffMs);
  if (abs < 60_000) return relativeFormatter.format(Math.round(diffMs / 1000), 'second');
  if (abs < 3_600_000) return relativeFormatter.format(Math.round(diffMs / 60_000), 'minute');
  if (abs < 86_400_000) return relativeFormatter.format(Math.round(diffMs / 3_600_000), 'hour');
  if (abs < 30 * 86_400_000)
    return relativeFormatter.format(Math.round(diffMs / 86_400_000), 'day');
  if (abs < 365 * 86_400_000)
    return relativeFormatter.format(Math.round(diffMs / (30 * 86_400_000)), 'month');
  return relativeFormatter.format(Math.round(diffMs / (365 * 86_400_000)), 'year');
}

// ── NextRunRow ────────────────────────────────────────────────────────────────

export interface NextRunRowProps {
  index: number;
  date: Date;
}

export function NextRunRow({ index, date }: NextRunRowProps) {
  const { copy, copied } = useCopyToClipboard();
  const formatted = localFormatter.format(date);
  const relative = formatRelative(date);
  return (
    <tr className="border-b border-edge last:border-0">
      <td className="w-6 py-2.5 pr-3 text-right text-[11px] font-medium text-fg-secondary">
        {index}
      </td>
      <td className="py-2.5 pr-2">
        <div className="font-mono text-xs text-fg">{formatted}</div>
        <div className="mt-0.5 text-[10px] text-fg-secondary">{relative}</div>
      </td>
      <td className="w-8 py-2.5 align-top">
        <button
          type="button"
          onClick={() => {
            void copy(formatted);
          }}
          className="rounded p-1 text-fg-secondary transition-colors hover:bg-surface-elevated hover:text-fg"
          aria-label={`Copy run ${String(index)} timestamp`}
          title="Copy"
        >
          {copied ? (
            <Check className="h-3 w-3 text-green-400" aria-hidden="true" />
          ) : (
            <Copy className="h-3 w-3" aria-hidden="true" />
          )}
        </button>
      </td>
    </tr>
  );
}

// ── FieldTable ────────────────────────────────────────────────────────────────

const FIELD_LABELS: { key: keyof CronExpression; label: string; range: string }[] = [
  { key: 'minute', label: 'Minute', range: '0–59' },
  { key: 'hour', label: 'Hour', range: '0–23' },
  { key: 'dayOfMonth', label: 'Day of month', range: '1–31' },
  { key: 'month', label: 'Month', range: '1–12' },
  { key: 'dayOfWeek', label: 'Day of week', range: '0–7 (0=Sun)' },
];

export interface FieldTableProps {
  expr: CronExpression;
}

export function FieldTable({ expr }: FieldTableProps) {
  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="border-b border-edge">
          <th className="py-1.5 pr-4 text-left text-[11px] font-medium uppercase tracking-wide text-fg-secondary">
            Field
          </th>
          <th className="py-1.5 pr-4 text-left text-[11px] font-medium uppercase tracking-wide text-fg-secondary">
            Value
          </th>
          <th className="py-1.5 text-left text-[11px] font-medium uppercase tracking-wide text-fg-secondary">
            Meaning
          </th>
        </tr>
      </thead>
      <tbody>
        {FIELD_LABELS.map(({ key, label, range }) => {
          const field = expr[key];
          if (!field || typeof field === 'string') return null;
          return (
            <tr key={key} className="border-b border-edge last:border-0">
              <td className="py-2 pr-4 text-fg-secondary">
                {label}
                <span className="ml-1.5 text-[10px] text-fg-secondary">{range}</span>
              </td>
              <td className="py-2 pr-4 font-mono text-fg-secondary">{field.raw}</td>
              <td className="py-2 text-fg-secondary">{field.description}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
