import type { Route } from './+types/jwt-decoder';
import { useState, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { KeyboardShortcutsModal } from '@/components/KeyboardShortcutsModal';
import {
  decodeJwtToken,
  isJwtError,
  formatUnixTimestamp,
  type JwtDecodeResult,
} from '@/features/tools/jwtDecoder';
import { Keyboard, Copy, CheckCheck, ClipboardPaste } from 'lucide-react';

export function meta(_args: Route.MetaArgs) {
  return [
    { title: 'JWT Decoder — Decode JSON Web Tokens Online — formatvault' },
    {
      name: 'description',
      content:
        'Decode and inspect JWT tokens online for free. View header, payload and expiry. No verification — 100% client-side, token never sent to a server.',
    },
  ];
}

// ── Claim display helpers ─────────────────────────────────────────────────────

function ClaimRow({ name, value }: { name: string; value: unknown }) {
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
    <tr className="border-b border-gray-800 last:border-0">
      <td className="w-32 py-2 pr-4 align-top font-mono text-xs text-gray-500">{name}</td>
      <td className="py-2 font-mono text-xs text-gray-200 break-all">{display}</td>
    </tr>
  );
}

function TimestampRow({
  name,
  unix,
  highlight,
}: {
  name: string;
  unix: number;
  highlight?: 'expired' | 'valid';
}) {
  const color =
    highlight === 'expired'
      ? 'text-red-400'
      : highlight === 'valid'
        ? 'text-green-400'
        : 'text-gray-200';
  return (
    <tr className="border-b border-gray-800 last:border-0">
      <td className="w-32 py-2 pr-4 align-top font-mono text-xs text-gray-500">{name}</td>
      <td className={`py-2 font-mono text-xs break-all ${color}`}>
        {formatUnixTimestamp(unix)}
        <span className="ml-2 text-gray-600">({String(unix)})</span>
      </td>
    </tr>
  );
}

function JsonBlock({ label, value }: { label: string; value: Record<string, unknown> }) {
  const { copy, copied } = useCopyToClipboard();
  const json = JSON.stringify(value, null, 2);
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900">
      <div className="flex items-center justify-between border-b border-gray-800 px-4 py-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
          {label}
        </span>
        <button
          type="button"
          onClick={() => {
            void copy(json);
          }}
          className="flex items-center gap-1 rounded px-2 py-0.5 text-[10px] text-gray-600 hover:bg-gray-800 hover:text-gray-400"
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

function TimingSection({ result }: { result: JwtDecodeResult }) {
  const hasAny = result.issuedAt !== null || result.expiresAt !== null || result.notBefore !== null;
  if (!hasAny) return null;

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900">
      <div className="border-b border-gray-800 px-4 py-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
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

// ── Main component ────────────────────────────────────────────────────────────

export default function JwtDecoder() {
  const [input, setInput] = useState('');
  const [showShortcuts, setShowShortcuts] = useState(false);
  const { copy: copyRaw, copied: copiedRaw } = useCopyToClipboard();

  const result = input.trim() ? decodeJwtToken(input) : null;
  const decoded = result && !isJwtError(result) ? result : null;
  const error = result && isJwtError(result) ? result.error : null;

  const clear = useCallback(() => {
    setInput('');
  }, []);

  const pasteFromClipboard = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput(text.trim());
    } catch {
      // Clipboard read not permitted — user must paste manually
    }
  }, []);

  const shortcuts = [
    {
      label: 'Clear',
      display: '⌘ K',
      key: 'k',
      meta: true,
      handler: clear,
    },
    {
      label: 'Show keyboard shortcuts',
      display: '?',
      key: '?',
      handler: () => {
        setShowShortcuts(true);
      },
    },
  ];

  useKeyboardShortcuts(shortcuts, !showShortcuts);

  // Payload without known timing claims (shown separately)
  const timingKeys = new Set(['iat', 'exp', 'nbf']);
  const payloadWithoutTiming = decoded
    ? Object.fromEntries(Object.entries(decoded.payload).filter(([k]) => !timingKeys.has(k)))
    : null;

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-800 bg-gray-950 px-4 py-2">
        <h1 className="text-sm font-semibold text-gray-200">JWT Decoder</h1>
        <div className="h-4 w-px bg-gray-800" aria-hidden="true" />
        <Badge variant="outline" className="text-[10px] text-gray-600">
          Decode only · no verification
        </Badge>

        <div className="flex-1" />

        {decoded && (
          <Badge variant={decoded.isExpired ? 'destructive' : 'default'} className="text-xs">
            {decoded.isExpired ? '✗ Expired' : '✓ Valid structure'}
          </Badge>
        )}
        {error && (
          <Badge variant="destructive" className="text-xs">
            ✗ Invalid
          </Badge>
        )}

        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-3 text-xs text-gray-500"
          onClick={clear}
          disabled={!input}
        >
          Clear
        </Button>

        <button
          type="button"
          className="rounded p-1 text-gray-600 hover:bg-gray-800 hover:text-gray-400"
          onClick={() => {
            setShowShortcuts(true);
          }}
          aria-label="Keyboard shortcuts"
          title="Keyboard shortcuts (?)"
        >
          <Keyboard className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>

      {/* Error bar */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 border-b border-red-900/60 bg-red-950/40 px-4 py-2 text-xs text-red-400"
        >
          <span className="shrink-0 font-mono font-semibold">Error</span>
          <span className="flex-1">{error}</span>
        </div>
      )}

      <div className="flex min-h-0 flex-1 gap-0 overflow-hidden">
        {/* Left: token input */}
        <div className="flex w-2/5 flex-col border-r border-gray-800">
          <div className="flex items-center justify-between border-b border-gray-800 px-3 py-1.5">
            <span className="text-[11px] font-medium uppercase tracking-wide text-gray-600">
              JWT Token
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  void pasteFromClipboard();
                }}
                className="flex items-center gap-1 rounded px-2 py-0.5 text-[10px] text-gray-600 hover:bg-gray-800 hover:text-gray-400"
                title="Paste from clipboard"
              >
                <ClipboardPaste className="h-3 w-3" aria-hidden="true" />
                Paste
              </button>
              <button
                type="button"
                onClick={() => {
                  void copyRaw(input);
                }}
                disabled={!input}
                className="flex items-center gap-1 rounded px-2 py-0.5 text-[10px] text-gray-600 hover:bg-gray-800 hover:text-gray-400 disabled:opacity-40"
                title="Copy token"
              >
                {copiedRaw ? (
                  <CheckCheck className="h-3 w-3 text-green-400" aria-hidden="true" />
                ) : (
                  <Copy className="h-3 w-3" aria-hidden="true" />
                )}
                Copy
              </button>
            </div>
          </div>
          <textarea
            className="flex-1 resize-none bg-gray-950 p-4 font-mono text-xs text-gray-200 placeholder-gray-700 focus:outline-none"
            placeholder="Paste a JWT token here…&#10;&#10;eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
            }}
            spellCheck={false}
            aria-label="JWT token input"
          />
          {/* Token anatomy legend */}
          {input.trim() && (
            <div className="border-t border-gray-800 px-3 py-2">
              <div className="flex flex-wrap gap-1 font-mono text-[10px]">
                {input
                  .trim()
                  .split('.')
                  .map((part, i) => {
                    const colors = ['text-red-400', 'text-purple-400', 'text-cyan-400'];
                    const labels = ['Header', 'Payload', 'Signature'];
                    return (
                      <span key={i} className={colors[i]}>
                        <span className="text-gray-700">{labels[i]}: </span>
                        {part.length > 20 ? `${part.slice(0, 20)}…` : part}
                      </span>
                    );
                  })}
              </div>
            </div>
          )}
        </div>

        {/* Right: decoded output */}
        <div className="flex flex-1 flex-col overflow-y-auto p-4 gap-4">
          {!decoded && !error && (
            <div className="flex h-full items-center justify-center text-xs text-gray-700">
              Paste a JWT token on the left to decode it
            </div>
          )}

          {decoded && (
            <>
              <JsonBlock label="Header" value={decoded.header} />
              <JsonBlock
                label="Payload"
                value={
                  payloadWithoutTiming && Object.keys(payloadWithoutTiming).length > 0
                    ? payloadWithoutTiming
                    : decoded.payload
                }
              />
              <TimingSection result={decoded} />

              {/* Signature notice */}
              <div className="rounded-lg border border-gray-800 bg-gray-900 px-4 py-3">
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  Signature
                </div>
                <div className="break-all font-mono text-xs text-gray-600">{decoded.signature}</div>
                <p className="mt-2 text-[10px] text-gray-700">
                  Signature is not verified. This tool only decodes the token structure.
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      <KeyboardShortcutsModal
        shortcuts={shortcuts}
        isOpen={showShortcuts}
        onClose={() => {
          setShowShortcuts(false);
        }}
      />
    </div>
  );
}
