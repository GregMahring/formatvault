import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { formatUnixTimestamp, type JwtDecodeResult } from '@/features/tools/jwtDecoder';
import { Copy, CheckCheck } from 'lucide-react';

// ── ClaimRow ──────────────────────────────────────────────────────────────────

export interface ClaimRowProps {
  name: string;
  value: unknown;
}

export function ClaimRow({ name, value }: ClaimRowProps) {
  const display =
    value === null
      ? 'null'
      : typeof value === 'object'
        ? JSON.stringify(value, null, 2)
        : typeof value === 'string'
          ? value
          : typeof value === 'number' || typeof value === 'boolean'
            ? String(value)
            : JSON.stringify(value);
  return (
    <tr className="border-b border-edge last:border-0">
      <td className="w-32 py-2 pr-4 align-top font-mono text-xs text-fg-secondary">{name}</td>
      <td className="py-2 font-mono text-xs text-fg break-all">{display}</td>
    </tr>
  );
}

// ── TimestampRow ──────────────────────────────────────────────────────────────

export interface TimestampRowProps {
  name: string;
  unix: number;
  highlight?: 'expired' | 'valid';
}

export function TimestampRow({ name, unix, highlight }: TimestampRowProps) {
  const color =
    highlight === 'expired' ? 'text-red-400' : highlight === 'valid' ? 'text-green-400' : 'text-fg';
  return (
    <tr className="border-b border-edge last:border-0">
      <td className="w-32 py-2 pr-4 align-top font-mono text-xs text-fg-secondary">{name}</td>
      <td className={`py-2 font-mono text-xs break-all ${color}`}>
        {formatUnixTimestamp(unix)}
        <span className="ml-2 text-fg-secondary">({String(unix)})</span>
      </td>
    </tr>
  );
}

// ── JsonBlock ─────────────────────────────────────────────────────────────────

export interface JsonBlockProps {
  label: string;
  value: Record<string, unknown>;
}

export function JsonBlock({ label, value }: JsonBlockProps) {
  const { copy, copied } = useCopyToClipboard();
  const json = JSON.stringify(value, null, 2);
  return (
    <div className="rounded-lg border border-edge bg-surface-raised">
      <div className="flex items-center justify-between border-b border-edge px-4 py-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-fg-secondary">
          {label}
        </span>
        <button
          type="button"
          onClick={() => {
            void copy(json);
          }}
          className="flex items-center gap-1 rounded px-2 py-0.5 text-[10px] text-fg-secondary hover:bg-surface-elevated hover:text-fg"
          aria-label={`Copy ${label}`}
        >
          {copied ? (
            <CheckCheck className="h-3 w-3 text-green-400" aria-hidden="true" />
          ) : (
            <Copy className="h-3 w-3" aria-hidden="true" />
          )}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <div className="overflow-x-auto px-4 py-3">
        <table className="w-full">
          <tbody>
            {Object.entries(value).map(([k, v]) => (
              <ClaimRow key={k} name={k} value={v} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── TimingSection ─────────────────────────────────────────────────────────────

export interface TimingSectionProps {
  result: JwtDecodeResult;
}

export function TimingSection({ result }: TimingSectionProps) {
  const hasAny = result.issuedAt !== null || result.expiresAt !== null || result.notBefore !== null;
  if (!hasAny) return null;

  return (
    <div className="rounded-lg border border-edge bg-surface-raised">
      <div className="border-b border-edge px-4 py-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-fg-secondary">
          Timing
        </span>
      </div>
      <div className="px-4 py-3">
        <table className="w-full">
          <tbody>
            {result.issuedAt !== null && typeof result.payload.iat === 'number' && (
              <TimestampRow name="iat" unix={result.payload.iat} />
            )}
            {result.notBefore !== null && typeof result.payload.nbf === 'number' && (
              <TimestampRow name="nbf" unix={result.payload.nbf} />
            )}
            {result.expiresAt !== null && typeof result.payload.exp === 'number' && (
              <TimestampRow
                name="exp"
                unix={result.payload.exp}
                highlight={result.isExpired ? 'expired' : 'valid'}
              />
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
