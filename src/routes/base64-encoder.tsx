import type { Route } from './+types/base64-encoder';
import { buildMeta } from '@/lib/meta';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PaneActions } from '@/components/PaneActions';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { usePiiMasking } from '@/hooks/usePiiMasking';
import { useRegisterCommands } from '@/hooks/useRegisterCommands';
import { PiiMaskToggle } from '@/components/PiiMaskToggle';
import { type Command } from '@/stores/commandStore';
import { KeyboardShortcutsModal } from '@/components/KeyboardShortcutsModal';
import { useEditorStore } from '@/stores/editorStore';
import {
  encodeBase64,
  decodeBase64,
  looksLikeBase64,
  isBase64Error,
  type Base64Mode,
} from '@/features/tools/base64Codec';
import { ToolPageContent } from '@/components/ToolPageContent';
import { Keyboard, ArrowLeftRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export { RouteErrorBoundary as ErrorBoundary } from '@/components/RouteErrorBoundary';

export function meta(_args: Route.MetaArgs) {
  return buildMeta({
    title: 'Base64 Encoder & Decoder — Private, No Upload',
    description:
      'Encode and decode Base64 privately in your browser — no data sent to any server. Unicode-safe, supports standard and URL-safe Base64. Auto-detects encode vs decode mode.',
    path: '/base64-encoder',
    faqItems: [
      {
        q: 'Is it safe to encode credentials or API keys here?',
        a: 'Yes. All encoding and decoding happens in your browser using native APIs — nothing is transmitted to any server. This makes it safe for encoding sensitive strings that you would not normally share.',
      },
      {
        q: 'What is the difference between standard and URL-safe Base64?',
        a: 'Standard Base64 uses + and / which have special meaning in URLs. URL-safe Base64 replaces them with - and _ respectively, making the output safe to include in URLs, filenames, and HTTP headers without percent-encoding.',
      },
      {
        q: 'Why does btoa() fail on my string but this tool works?',
        a: "JavaScript's built-in btoa() only handles Latin-1 characters. formatvault uses js-base64 which correctly handles the full Unicode character set including emoji and multi-byte characters.",
      },
      {
        q: 'How does auto-detect mode work?',
        a: 'The tool inspects your input and checks whether it matches the Base64 character set and length rules. If it looks like Base64, it switches to decode mode. You can override this manually.',
      },
    ],
  });
}

export default function Base64Encoder() {
  const [input, setInputRaw] = useState('');
  const [mode, setMode] = useState<Base64Mode>('encode');
  const [urlSafe, setUrlSafe] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Load pre-loaded input from the landing page paste flow
  useEffect(() => {
    const preloaded = useEditorStore.getState().input;
    if (preloaded) {
      setInput(preloaded);
      useEditorStore.getState().reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-detect mode when input changes
  useEffect(() => {
    if (!input.trim()) return;
    setMode(looksLikeBase64(input) ? 'decode' : 'encode');
  }, [input]);

  const result = input.trim()
    ? mode === 'encode'
      ? encodeBase64(input, urlSafe)
      : decodeBase64(input)
    : null;

  const output = result && !isBase64Error(result) ? result.output : '';
  const error = result && isBase64Error(result) ? result.error : null;
  const pii = usePiiMasking(output);

  const setInput = useCallback((v: string) => {
    setInputRaw(v);
  }, []);
  const clear = useCallback(() => {
    setInputRaw('');
  }, []);
  const swap = useCallback(() => {
    if (output) {
      setInputRaw(output);
      setMode((m) => (m === 'encode' ? 'decode' : 'encode'));
    }
  }, [output]);

  const shortcuts = [
    {
      label: 'Swap input ↔ output',
      display: '⌘ ⇧ S',
      key: 's',
      meta: true,
      shift: true,
      handler: swap,
    },
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
        id: 'action:swap',
        label: 'Swap input ↔ output',
        group: 'Actions',
        shortcut: '⌘ ⇧ S',
        handler: swap,
      },
      {
        id: 'action:clear',
        label: 'Clear',
        group: 'Actions',
        shortcut: '⌘ ⇧ K',
        handler: clear,
      },
    ],
    [swap, clear]
  );
  useRegisterCommands(commands);

  return (
    <>
      <div className="flex h-full flex-col">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-edge bg-surface px-4 py-2">
          <h1 className="text-sm font-semibold text-label-indigo">Base64 Encoder / Decoder</h1>
          <div className="h-4 w-px bg-surface-elevated" aria-hidden="true" />

          {/* Mode toggle */}
          <div className="flex items-center rounded-md border border-edge bg-surface-raised p-0.5">
            {(['encode', 'decode'] as Base64Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                }}
                className={cn(
                  'rounded px-3 py-1 text-xs font-medium capitalize transition-colors',
                  mode === m ? 'bg-surface-elevated text-fg' : 'text-fg-secondary hover:text-fg'
                )}
              >
                {m}
              </button>
            ))}
          </div>

          {/* URL-safe toggle (encode mode only) */}
          {mode === 'encode' && (
            <>
              <div className="h-4 w-px bg-surface-elevated" aria-hidden="true" />
              <div className="flex items-center rounded-md border border-edge bg-surface-raised p-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setUrlSafe(false);
                  }}
                  className={cn(
                    'rounded px-2 py-0.5 text-xs transition-colors',
                    !urlSafe ? 'bg-surface-elevated text-fg' : 'text-fg-secondary hover:text-fg'
                  )}
                >
                  Standard
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUrlSafe(true);
                  }}
                  className={cn(
                    'rounded px-2 py-0.5 text-xs transition-colors',
                    urlSafe ? 'bg-surface-elevated text-fg' : 'text-fg-secondary hover:text-fg'
                  )}
                >
                  URL-safe
                </button>
              </div>
            </>
          )}

          <div className="flex-1" />

          {result && !isBase64Error(result) && input.trim() && (
            <Badge variant="success" dot>
              {mode === 'encode' ? 'encoded' : 'decoded'}
            </Badge>
          )}
          {error && (
            <Badge variant="destructive" dot>
              error
            </Badge>
          )}

          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1.5 px-3 text-xs text-fg-secondary"
            onClick={swap}
            disabled={!output}
            title="Swap input and output (⌘⇧S)"
          >
            <ArrowLeftRight className="h-3 w-3" aria-hidden="true" />
            Swap
          </Button>
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

        {/* Split layout */}
        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          {/* Input */}
          <div className="flex w-full flex-col border-b border-r-0 border-edge md:w-1/2 md:border-b-0 md:border-r">
            <div className="flex h-8 shrink-0 items-center border-b border-edge px-3">
              <span className="text-[11px] font-medium uppercase tracking-wide text-label-cyan">
                {mode === 'encode' ? 'Plain text' : 'Base64'}
              </span>
            </div>
            <textarea
              className="flex-1 resize-none bg-surface-raised p-4 font-mono text-sm text-fg placeholder:text-fg-secondary focus:outline-none"
              placeholder={
                mode === 'encode' ? 'Paste or type text to encode…' : 'Paste Base64 to decode…'
              }
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
              }}
              spellCheck={false}
              aria-label="Input"
            />
            {/* Character/byte stats */}
            {input && (
              <div className="border-t border-edge px-3 py-1.5 text-[10px] text-fg-muted">
                {String(input.length)} chars · {String(new TextEncoder().encode(input).length)}{' '}
                bytes
              </div>
            )}
          </div>

          {/* Output */}
          <div className="flex w-full flex-col md:w-1/2">
            <div className="flex h-8 shrink-0 items-center justify-between border-b border-edge px-3">
              <span className="text-[11px] font-medium uppercase tracking-wide text-label-cyan">
                {mode === 'encode' ? 'Base64' : 'Plain text'}
              </span>
              <div className="flex items-center gap-1">
                <PiiMaskToggle pii={pii} />
                <PaneActions
                  content={pii.displayContent}
                  downloadFilename={mode === 'encode' ? 'encoded.txt' : 'decoded.txt'}
                />
              </div>
            </div>
            <textarea
              className="flex-1 resize-none bg-surface-raised p-4 font-mono text-sm text-fg placeholder:text-fg-secondary focus:outline-none"
              placeholder={mode === 'encode' ? 'Encoded output…' : 'Decoded output…'}
              value={pii.displayContent}
              readOnly
              aria-label="Output"
              aria-live="polite"
            />
            {output && (
              <div className="border-t border-edge px-3 py-1.5 text-[10px] text-fg-muted">
                {String(output.length)} chars
              </div>
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
      <ToolPageContent
        toolName="Base64 encoder"
        why={
          <div className="space-y-3 text-fg-secondary">
            <p>
              Base64 is commonly used to encode credentials, API keys, binary files, and
              authentication headers. Online Base64 encoders that process your data server-side can
              log the plaintext content — the exact thing you are trying to encode.
            </p>
            <p>
              formatvault encodes and decodes Base64 using the browser's native APIs and the
              unicode-safe{' '}
              <code className="rounded px-1 py-0.5 font-mono text-[0.85em] text-label-cyan bg-label-cyan/8">
                js-base64
              </code>{' '}
              library. Nothing is transmitted. The output appears instantly as you type.
            </p>
          </div>
        }
        howItWorks={
          <div className="space-y-3 text-fg-secondary">
            <p>
              Standard Base64 uses the characters{' '}
              <code className="rounded px-1 py-0.5 font-mono text-[0.85em] text-label-cyan bg-label-cyan/8">
                A–Z a–z 0–9 + /
              </code>{' '}
              with{' '}
              <code className="rounded px-1 py-0.5 font-mono text-[0.85em] text-label-cyan bg-label-cyan/8">
                =
              </code>{' '}
              padding. URL-safe Base64 replaces{' '}
              <code className="rounded px-1 py-0.5 font-mono text-[0.85em] text-label-cyan bg-label-cyan/8">
                +
              </code>{' '}
              with{' '}
              <code className="rounded px-1 py-0.5 font-mono text-[0.85em] text-label-cyan bg-label-cyan/8">
                -
              </code>{' '}
              and{' '}
              <code className="rounded px-1 py-0.5 font-mono text-[0.85em] text-label-cyan bg-label-cyan/8">
                /
              </code>{' '}
              with{' '}
              <code className="rounded px-1 py-0.5 font-mono text-[0.85em] text-label-cyan bg-label-cyan/8">
                _
              </code>
              , making it safe for use in URLs and filenames. The encoder auto-detects whether your
              input looks like Base64 and switches to decode mode automatically.
            </p>
            <p>
              Full Unicode support means emoji, accented characters, and non-Latin scripts are
              encoded correctly — unlike{' '}
              <code className="rounded px-1 py-0.5 font-mono text-[0.85em] text-label-cyan bg-label-cyan/8">
                btoa()
              </code>
              , which fails on multi-byte characters.
            </p>
          </div>
        }
        useCases={[
          'Encoding HTTP Basic Auth credentials (username:password) for Authorization headers',
          'Decoding base64-encoded JWT payloads or SAML assertions',
          'Encoding binary file content (images, PDFs) for embedding in JSON or HTML',
          'Decoding base64-encoded environment variables stored in CI/CD systems',
          'Encoding API keys or secrets before storing them in config files',
          'Converting base64-encoded email attachments for inspection',
          'Verifying that a base64 string round-trips correctly before embedding in code',
        ]}
        faq={[
          {
            q: 'Is it safe to encode credentials or API keys here?',
            a: 'Yes. All encoding and decoding happens in your browser using native APIs — nothing is transmitted to any server. This makes it safe for encoding sensitive strings that you would not normally share.',
          },
          {
            q: 'What is the difference between standard and URL-safe Base64?',
            a: 'Standard Base64 uses + and / which have special meaning in URLs. URL-safe Base64 replaces them with - and _ respectively, making the output safe to include in URLs, filenames, and HTTP headers without percent-encoding.',
          },
          {
            q: 'Why does btoa() fail on my string but this tool works?',
            a: "JavaScript's built-in btoa() only handles Latin-1 characters. formatvault uses js-base64 which correctly handles the full Unicode character set including emoji and multi-byte characters.",
          },
          {
            q: 'How does auto-detect mode work?',
            a: 'The tool inspects your input and checks whether it matches the Base64 character set and length rules. If it looks like Base64, it switches to decode mode. You can override this manually.',
          },
        ]}
      />
    </>
  );
}
