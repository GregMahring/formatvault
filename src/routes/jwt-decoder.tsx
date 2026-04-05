import type { Route } from './+types/jwt-decoder';
import { buildMeta } from '@/lib/meta';
import { useState, useCallback, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { usePiiMasking } from '@/hooks/usePiiMasking';
import { useRegisterCommands } from '@/hooks/useRegisterCommands';
import { PiiMaskToggle } from '@/components/PiiMaskToggle';
import { usePreloadedInput } from '@/hooks/usePreloadedInput';
import { type Command } from '@/stores/commandStore';
import { KeyboardShortcutsModal } from '@/components/KeyboardShortcutsModal';
import {
  decodeJwtToken,
  isJwtError,
  formatUnixTimestamp,
  type JwtDecodeResult,
} from '@/features/tools/jwtDecoder';
import { ToolPageContent } from '@/components/ToolPageContent';
import { Keyboard, Copy, CheckCheck, ClipboardPaste } from 'lucide-react';

export { RouteErrorBoundary as ErrorBoundary } from '@/components/RouteErrorBoundary';

export function meta(_args: Route.MetaArgs) {
  return buildMeta({
    title: 'JWT Decoder — Token Never Sent to a Server',
    description:
      'Decode JWT tokens privately in your browser — your token is never transmitted to any server. View header, payload and expiry claims. 100% client-side, decode only.',
    path: '/jwt-decoder',
    faqItems: [
      {
        q: 'Is it safe to paste my JWT here?',
        a: 'Yes. The token is decoded entirely in your browser — no part of the token is sent over the network. Open DevTools → Network to confirm zero outbound requests.',
      },
      {
        q: 'Does this verify the signature?',
        a: "No. Signature verification requires the secret or public key used to sign the token. This tool only decodes and displays the header and payload. Never trust a token's claims in production without verifying the signature server-side.",
      },
      {
        q: 'Why does the expiry say my token is already expired?',
        a: 'JWT timestamps are Unix epoch seconds (not milliseconds). The decoder converts exp and iat to human-readable local time automatically. If it shows expired, the token genuinely has a past expiry — check your token refresh logic.',
      },
      {
        q: 'What algorithms does this support?',
        a: 'The decoder works with any JWT regardless of the signing algorithm (HS256, RS256, ES256, etc.) because decoding the payload does not require the key. The alg field in the header tells you which algorithm was used to sign it.',
      },
      {
        q: 'Can I decode tokens that contain sensitive user data?',
        a: 'Yes — that is exactly the use case this tool is designed for. Because nothing leaves your browser, you can safely decode tokens containing PII, user IDs, or internal role assignments without exposing them to a third party.',
      },
    ],
  });
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
    <tr className="border-b border-edge last:border-0">
      <td className="w-32 py-2 pr-4 align-top font-mono text-xs text-fg-secondary">{name}</td>
      <td className="py-2 font-mono text-xs text-fg break-all">{display}</td>
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

function JsonBlock({ label, value }: { label: string; value: Record<string, unknown> }) {
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

function TimingSection({ result }: { result: JwtDecodeResult }) {
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

// ── Main component ────────────────────────────────────────────────────────────

export default function JwtDecoder() {
  const [input, setInput] = useState('');
  const [showShortcuts, setShowShortcuts] = useState(false);
  const { copy: copyRaw, copied: copiedRaw } = useCopyToClipboard();

  usePreloadedInput(setInput);

  const result = input.trim() ? decodeJwtToken(input) : null;
  const decoded = result && !isJwtError(result) ? result : null;
  const error = result && isJwtError(result) ? result.error : null;

  // Serialise full payload for PII scanning
  const payloadJson = decoded ? JSON.stringify(decoded.payload, null, 2) : '';
  const pii = usePiiMasking(payloadJson);

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
      display: '⌘ ⇧ K',
      key: 'k',
      meta: true,
      shift: true,
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

  const commands = useMemo<Command[]>(
    () => [
      {
        id: 'action:clear',
        label: 'Clear',
        group: 'Actions',
        shortcut: '⌘ ⇧ K',
        handler: clear,
      },
    ],
    [clear]
  );
  useRegisterCommands(commands);

  // Payload without known timing claims (shown separately)
  const timingKeys = new Set(['iat', 'exp', 'nbf']);
  const payloadWithoutTiming = decoded
    ? Object.fromEntries(Object.entries(decoded.payload).filter(([k]) => !timingKeys.has(k)))
    : null;

  return (
    <>
      <div className="flex min-h-full flex-col">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-edge bg-surface px-4 py-2">
          <h1 className="text-sm font-semibold text-label-indigo">JWT Decoder</h1>
          <div className="h-4 w-px bg-surface-elevated" aria-hidden="true" />
          <Badge variant="outline" className="text-[10px] text-fg-secondary">
            Decode only · no verification
          </Badge>

          <div className="flex-1" />

          {decoded && (
            <Badge variant={decoded.isExpired ? 'destructive' : 'success'} dot>
              {decoded.isExpired ? 'expired' : 'valid'}
            </Badge>
          )}
          {error && (
            <Badge variant="destructive" dot>
              invalid
            </Badge>
          )}

          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-3 text-xs text-fg-secondary"
            onClick={clear}
            disabled={!input}
          >
            Clear
          </Button>

          <button
            type="button"
            className="rounded p-1 text-fg-secondary hover:bg-surface-elevated hover:text-fg"
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
          <div className="flex w-2/5 flex-col overflow-hidden border-r border-edge">
            <div className="flex h-8 shrink-0 items-center justify-between border-b border-edge px-3">
              <span className="text-[11px] font-medium uppercase tracking-wide text-label-cyan">
                JWT Token
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    void pasteFromClipboard();
                  }}
                  className="flex items-center gap-1 rounded px-2 py-0.5 text-[10px] text-fg-secondary hover:bg-surface-elevated hover:text-fg"
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
                  className="flex items-center gap-1 rounded px-2 py-0.5 text-[10px] text-fg-secondary hover:bg-surface-elevated hover:text-fg disabled:opacity-40"
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
              className="flex-1 resize-none bg-surface-raised p-4 font-mono text-xs text-fg placeholder:text-fg-secondary focus:outline-none"
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
              <div className="border-t border-edge px-3 py-2">
                <div className="flex flex-wrap gap-1 font-mono text-[10px]">
                  {input
                    .trim()
                    .split('.')
                    .map((part, i) => {
                      const colors = ['text-jwt-header', 'text-jwt-payload', 'text-jwt-sig'];
                      const labels = ['Header', 'Payload', 'Signature'];
                      return (
                        <span key={i} className={colors[i]}>
                          <span className="text-fg-secondary">{labels[i]}: </span>
                          {part.length > 20 ? `${part.slice(0, 20)}…` : part}
                        </span>
                      );
                    })}
                </div>
              </div>
            )}
          </div>

          {/* Right: decoded output */}
          <div className="flex flex-1 flex-col overflow-y-auto">
            <div className="flex h-8 shrink-0 items-center justify-between border-b border-edge px-4">
              <span className="text-[11px] font-medium uppercase tracking-wide text-label-cyan">
                Decoded
              </span>
              <PiiMaskToggle pii={pii} />
            </div>
            <div className="flex flex-1 flex-col gap-4 p-4 bg-surface-raised">
              {!decoded && !error && (
                <div className="flex h-full items-center justify-center text-xs text-fg-secondary">
                  Paste a JWT token on the left to decode it
                </div>
              )}

              {decoded && (
                <>
                  <JsonBlock label="Header" value={decoded.header} />
                  {pii.enabled && pii.matchCount > 0 ? (
                    <div className="rounded-lg border border-edge bg-surface-raised">
                      <div className="border-b border-edge px-4 py-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-fg-secondary">
                          Payload (masked)
                        </span>
                      </div>
                      <pre className="overflow-x-auto px-4 py-3 font-mono text-xs text-fg whitespace-pre-wrap">
                        {pii.displayContent}
                      </pre>
                    </div>
                  ) : (
                    <>
                      <JsonBlock
                        label="Payload"
                        value={
                          payloadWithoutTiming && Object.keys(payloadWithoutTiming).length > 0
                            ? payloadWithoutTiming
                            : decoded.payload
                        }
                      />
                      <TimingSection result={decoded} />
                    </>
                  )}

                  {/* Signature notice */}
                  <div className="rounded-lg border border-edge bg-surface-raised px-4 py-3">
                    <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-fg-secondary">
                      Signature
                    </div>
                    <div className="break-all font-mono text-xs text-fg-secondary">
                      {decoded.signature}
                    </div>
                    <p className="mt-2 text-[10px] text-fg-secondary">
                      Signature is not verified. This tool only decodes the token structure.
                    </p>
                  </div>
                </>
              )}
            </div>
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
      <ToolPageContent
        toolName="JWT decoder"
        why={
          <div className="space-y-3 text-fg-secondary">
            <p>
              A JWT (JSON Web Token) contains your user's identity, roles, and session claims.
              Pasting it into an online decoder means transmitting a live bearer credential to a
              third-party server. Even if the token is short-lived, that window is enough for it to
              be logged, replayed, or harvested.
            </p>
            <p>
              formatvault decodes the base64url-encoded header and payload sections directly in your
              browser. Nothing is transmitted — not the token, not the claims, not the signature.
              The decode happens in the same JavaScript context as your other browser tabs.
            </p>
          </div>
        }
        howItWorks={
          <div className="space-y-3 text-fg-secondary">
            <p>
              A JWT is three base64url-encoded sections separated by dots:{' '}
              <code className="rounded px-1 py-0.5 font-mono text-[0.85em] text-label-cyan bg-label-cyan/8">
                header.payload.signature
              </code>
              . The decoder splits on the dots, base64url-decodes each section, and parses the
              resulting JSON.
            </p>
            <p>
              The signature is displayed as-is but{' '}
              <strong className="font-medium text-fg">never verified</strong> — signature
              verification requires the secret key and is intentionally out of scope. This tool is
              for inspecting and debugging tokens, not validating them in production.
            </p>
          </div>
        }
        useCases={[
          'Inspecting the claims inside a token returned by your auth provider (Auth0, Cognito, Okta)',
          'Debugging expiry issues — the exp and iat claims are displayed as human-readable timestamps',
          'Checking which roles or scopes are encoded in the payload during development',
          'Verifying that your backend is signing tokens with the correct algorithm (RS256, HS256)',
          'Reading tokens in CI/CD pipelines or during incident response without using a web service',
          'Teaching JWT structure to developers new to token-based authentication',
        ]}
        faq={[
          {
            q: 'Is it safe to paste my JWT here?',
            a: 'Yes. The token is decoded entirely in your browser using the Web Crypto API — no part of the token is sent over the network. Open DevTools → Network to confirm zero outbound requests.',
          },
          {
            q: 'Does this verify the signature?',
            a: "No. Signature verification requires the secret or public key used to sign the token. This tool only decodes and displays the header and payload. Never trust a token's claims in production without verifying the signature server-side.",
          },
          {
            q: 'Why does the expiry say my token is already expired?',
            a: 'JWT timestamps are Unix epoch seconds (not milliseconds). The decoder converts exp and iat to human-readable local time automatically. If it shows expired, the token genuinely has a past expiry — check your token refresh logic.',
          },
          {
            q: 'What algorithms does this support?',
            a: 'The decoder works with any JWT regardless of the signing algorithm (HS256, RS256, ES256, etc.) because decoding the payload does not require the key. The alg field in the header tells you which algorithm was used to sign it.',
          },
          {
            q: 'Can I decode tokens that contain sensitive user data?',
            a: 'Yes — that is exactly the use case this tool is designed for. Because nothing leaves your browser, you can safely decode tokens containing PII, user IDs, or internal role assignments without exposing them to a third party.',
          },
        ]}
      />
    </>
  );
}
