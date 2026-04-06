import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { Copy, Check } from 'lucide-react';

// ── ResultRow ─────────────────────────────────────────────────────────────────

export interface ResultRowProps {
  label: string;
  value: string;
}

export function ResultRow({ label, value }: ResultRowProps) {
  const { copy, copied } = useCopyToClipboard();

  return (
    <tr className="border-b border-edge last:border-0">
      <td className="w-28 py-2.5 pr-4 align-top text-[11px] font-medium uppercase tracking-wide text-fg-secondary">
        {label}
      </td>
      <td className="py-2.5 pr-2 font-mono text-xs text-fg break-all">{value}</td>
      <td className="w-8 py-2.5 align-top">
        <button
          type="button"
          onClick={() => {
            void copy(value);
          }}
          className="rounded p-1 text-fg-secondary transition-colors hover:bg-surface-elevated hover:text-fg"
          aria-label={`Copy ${label}`}
          title={`Copy ${label}`}
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

// ── TimestampCopyRow ──────────────────────────────────────────────────────────

export interface TimestampCopyRowProps {
  label: string;
  value: number;
}

export function TimestampCopyRow({ label, value }: TimestampCopyRowProps) {
  const { copy, copied } = useCopyToClipboard();
  const display = String(value);

  return (
    <div className="flex items-center gap-3">
      <span className="w-24 text-[11px] font-medium uppercase tracking-wide text-fg-secondary">
        {label}
      </span>
      <span className="flex-1 font-mono text-sm text-fg">{display}</span>
      <button
        type="button"
        onClick={() => {
          void copy(display);
        }}
        className="rounded p-1 text-fg-secondary transition-colors hover:bg-surface-elevated hover:text-fg"
        aria-label={`Copy ${label}`}
      >
        {copied ? (
          <Check className="h-3 w-3 text-green-400" aria-hidden="true" />
        ) : (
          <Copy className="h-3 w-3" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
