import type { Route } from './+types/hash-generator';
import { useCallback, useMemo, useState } from 'react';
import { buildMeta } from '@/lib/meta';
import { Button } from '@/components/ui/button';
import { FileUploadZone } from '@/components/FileUploadZone';
import { KeyboardShortcutsModal } from '@/components/KeyboardShortcutsModal';
import { useKeyboardShortcuts, type Shortcut } from '@/hooks/useKeyboardShortcuts';
import { useRegisterCommands } from '@/hooks/useRegisterCommands';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { type Command } from '@/stores/commandStore';
import { useHashGenerator } from '@/features/tools/useHashGenerator';
import { HASH_ALGORITHMS, isHashError } from '@/features/tools/hashGenerator';
import { Check, Copy, Keyboard } from 'lucide-react';
import { ToolPageContent } from '@/components/ToolPageContent';
import { cn } from '@/lib/utils';

export { RouteErrorBoundary as ErrorBoundary } from '@/components/RouteErrorBoundary';

const FAQ = [
  {
    q: 'Which hash algorithms are supported?',
    a: 'MD5, SHA-256, and SHA-512. Each result is shown as hex and Base64, ready to copy.',
  },
  {
    q: 'Can I hash a file?',
    a: 'Yes. Switch to file input and choose a file. It is read locally by your browser and never uploaded, so you can verify large downloads or private documents.',
  },
  {
    q: 'Should I use MD5 or SHA-256?',
    a: 'Use SHA-256 or SHA-512 for anything security-related. MD5 is broken for security purposes because collisions can be produced deliberately, but it is still fine for non-adversarial checks such as cache keys or matching a published MD5 checksum.',
  },
  {
    q: 'Can I use this to hash passwords?',
    a: 'No — and you should not use any of these algorithms on their own for password storage. They are designed to be fast, which makes brute-forcing easy. Use a password hashing function such as Argon2, bcrypt, or scrypt.',
  },
  {
    q: "Why does my hash differ from another tool's?",
    a: 'Text is hashed as UTF-8 bytes exactly as entered. A trailing newline, different line endings (CRLF vs LF), or another text encoding will change the result.',
  },
];

export function meta(_args: Route.MetaArgs) {
  return buildMeta({
    title: 'Hash Generator — MD5, SHA-256, SHA-512, No Upload',
    description:
      'Generate MD5, SHA-256, and SHA-512 hashes from text or files privately in your browser — no data ever leaves your device. Hex and Base64 output. 100% client-side.',
    path: '/hash-generator',
    faqItems: FAQ,
  });
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const { copy, copied } = useCopyToClipboard();
  return (
    <button
      type="button"
      onClick={() => {
        void copy(text);
      }}
      disabled={!text}
      className={cn(
        'flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] transition-colors hover:bg-surface-elevated disabled:opacity-30',
        copied ? 'text-success-fg' : 'text-fg-secondary hover:text-fg'
      )}
      aria-label={`Copy ${label}`}
      title={`Copy ${label}`}
    >
      {copied ? (
        <Check className="h-3 w-3" aria-hidden="true" />
      ) : (
        <Copy className="h-3 w-3" aria-hidden="true" />
      )}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

export default function HashGenerator() {
  const hash = useHashGenerator();
  const [showShortcuts, setShowShortcuts] = useState(false);

  const handleFileUpload = useCallback(
    (file: File) => {
      void hash.hashFile(file);
    },
    [hash]
  );

  const shortcuts: Shortcut[] = [
    {
      label: 'Clear',
      display: '⌘ ⇧ K',
      key: 'k',
      meta: true,
      shift: true,
      handler: hash.clear,
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
        handler: hash.clear,
      },
    ],
    [hash.clear]
  );
  useRegisterCommands(commands);

  return (
    <>
      {/* shrink-0: the layout's scroll container would otherwise squeeze the tool to fit the content below it. */}
      <div className="flex h-full shrink-0 flex-col">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-edge bg-surface px-4 py-2">
          <h1 className="text-sm font-semibold text-label-indigo">Hash Generator</h1>
          <div className="h-4 w-px bg-surface-elevated" aria-hidden="true" />

          {/* Algorithm tabs */}
          <div
            className="flex items-center gap-0.5 rounded-md bg-surface-raised p-0.5"
            role="tablist"
            aria-label="Hash algorithm"
          >
            {HASH_ALGORITHMS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={hash.algorithm === value}
                onClick={() => {
                  hash.setAlgorithm(value);
                }}
                className={cn(
                  'rounded px-2.5 py-1 text-xs font-medium transition-colors',
                  hash.algorithm === value
                    ? 'bg-accent-600/30 text-accent-fg ring-1 ring-accent-500/50'
                    : 'text-fg-secondary hover:bg-surface-elevated hover:text-fg'
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-surface-elevated" aria-hidden="true" />

          {/* Input mode toggle */}
          <div
            className="flex items-center gap-0.5 rounded-md bg-surface-raised p-0.5"
            role="tablist"
            aria-label="Input mode"
          >
            {(['text', 'file'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                role="tab"
                aria-selected={hash.inputMode === mode}
                onClick={() => {
                  hash.setInputMode(mode);
                }}
                className={cn(
                  'rounded px-2.5 py-1 text-xs font-medium capitalize transition-colors',
                  hash.inputMode === mode
                    ? 'bg-surface-elevated text-fg'
                    : 'text-fg-secondary hover:bg-surface-elevated hover:text-fg'
                )}
              >
                {mode}
              </button>
            ))}
          </div>

          <div className="flex-1" />

          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-3 text-xs text-fg-secondary"
            onClick={hash.clear}
            disabled={!hash.input && !hash.result}
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
        {hash.result !== null && isHashError(hash.result) && (
          <div
            role="alert"
            className="flex items-start gap-2 border-b border-danger-fg/30 bg-danger-fg/10 px-4 py-2 text-xs text-danger-fg"
          >
            <span className="shrink-0 font-mono font-semibold">Error</span>
            <span className="flex-1">{hash.result.error}</span>
          </div>
        )}

        {/* Main content */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 gap-4">
          {/* Input section */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-wide text-label-cyan">
                {hash.inputMode === 'text' ? 'Input text' : 'File'}
              </span>
            </div>

            {hash.inputMode === 'text' ? (
              <textarea
                value={hash.input}
                onChange={(e) => {
                  hash.setInput(e.target.value);
                }}
                placeholder="Type or paste text to hash…"
                spellCheck={false}
                aria-label="Text input to hash"
                className="h-32 w-full resize-none rounded-md border border-edge bg-surface-raised p-3 font-mono text-sm text-fg placeholder:text-fg-secondary focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
              />
            ) : (
              /* Full-area drag-and-drop zone for file upload */
              <FileUploadZone
                onFile={handleFileUpload}
                disabled={hash.isHashing}
                className="flex h-32 w-full items-center justify-center rounded-md border border-dashed border-edge-emphasis bg-surface-raised/50"
              />
            )}

            {/* Show selected filename below the drop zone */}
            {hash.inputMode === 'file' && hash.fileName && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-fg-secondary">{hash.fileName}</span>
                {hash.isHashing && <span className="text-fg-secondary">Hashing…</span>}
              </div>
            )}
          </div>

          {/* Output section */}
          {hash.isHashing && hash.result === null && (
            <div className="flex items-center gap-2 text-xs text-fg-secondary">
              <span className="inline-block h-3 w-3 animate-spin rounded-full border border-surface-elevated border-t-accent-500" />
              Hashing…
            </div>
          )}

          {hash.result !== null && !isHashError(hash.result) && (
            <div className="flex flex-col gap-0 overflow-hidden rounded-md border border-edge">
              {/* Hex row */}
              <div className="flex items-center gap-3 border-b border-edge bg-surface-raised/60 px-4 py-3">
                <span className="w-14 shrink-0 text-[11px] font-semibold uppercase tracking-wide text-fg-secondary">
                  Hex
                </span>
                <span
                  className="flex-1 truncate font-mono text-xs text-fg select-all"
                  title={hash.result.hex}
                >
                  {hash.result.hex}
                </span>
                <CopyButton text={hash.result.hex} label="hex hash" />
              </div>

              {/* Base64 row */}
              <div className="flex items-center gap-3 bg-surface-raised/40 px-4 py-3">
                <span className="w-14 shrink-0 text-[11px] font-semibold uppercase tracking-wide text-fg-secondary">
                  Base64
                </span>
                <span
                  className="flex-1 truncate font-mono text-xs text-fg select-all"
                  title={hash.result.base64}
                >
                  {hash.result.base64}
                </span>
                <CopyButton text={hash.result.base64} label="base64 hash" />
              </div>
            </div>
          )}

          {!hash.isHashing && !hash.result && hash.inputMode === 'text' && !hash.input && (
            <div className="flex flex-col items-center gap-1 py-8 text-center">
              <p className="text-sm text-fg-secondary">Type text above to generate a hash</p>
              <p className="text-xs text-fg-secondary">
                Supports MD5, SHA-256, and SHA-512 — shows hex and Base64 output
              </p>
            </div>
          )}
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
        toolName="hash generator"
        why={
          <div className="space-y-3 text-fg-secondary">
            <p>
              Hashing is often done on sensitive input: an API secret you need a fingerprint of, a
              document you need to prove has not changed, or a file you are about to share. An
              online hash tool that processes input on its server sees the original, not just the
              hash.
            </p>
            <p>
              formatvault computes hashes in your browser. Text and files stay on your device; only
              the result is shown to you.
            </p>
          </div>
        }
        howItWorks={
          <div className="space-y-3 text-fg-secondary">
            <p>
              SHA-256 and SHA-512 use the browser&apos;s native Web Crypto API, the same
              implementation browsers use for TLS. MD5 is not part of Web Crypto, so it uses a small
              bundled JavaScript implementation.
            </p>
            <p>
              Text is converted to UTF-8 bytes before hashing. Files are read directly as bytes, so
              the result matches command-line tools like sha256sum and md5sum.
            </p>
          </div>
        }
        useCases={[
          'Verifying a downloaded installer against its published SHA-256 checksum',
          'Fingerprinting an API key or secret without storing the secret itself',
          'Checking whether two files are byte-for-byte identical',
          'Generating Subresource Integrity values (Base64 SHA-512) for script tags',
          'Producing cache keys or ETags while debugging',
        ]}
        faq={FAQ}
      />
    </>
  );
}
