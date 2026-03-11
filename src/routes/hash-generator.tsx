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
import { cn } from '@/lib/utils';

export { RouteErrorBoundary as ErrorBoundary } from '@/components/RouteErrorBoundary';

export function meta(_args: Route.MetaArgs) {
  return buildMeta({
    title: 'Hash Generator — MD5, SHA-256, SHA-512 Online',
    description:
      'Generate MD5, SHA-256, and SHA-512 hashes from text or files. Shows hex and Base64 output. 100% client-side — no data ever leaves your browser.',
    path: '/hash-generator',
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
      className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] transition-colors hover:bg-surface-elevated disabled:opacity-30"
      aria-label={`Copy ${label}`}
      title={`Copy ${label}`}
    >
      {copied ? (
        <Check className="h-3 w-3 text-green-400" aria-hidden="true" />
      ) : (
        <Copy className="h-3 w-3 text-fg-tertiary" aria-hidden="true" />
      )}
      <span className={cn('text-fg-tertiary', copied && 'text-green-400')}>
        {copied ? 'Copied!' : 'Copy'}
      </span>
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
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-edge bg-surface px-4 py-2">
        <h1 className="text-sm font-semibold text-fg">Hash Generator</h1>
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
                  ? 'bg-accent-600/30 text-accent-300 ring-1 ring-accent-500/50'
                  : 'text-fg-tertiary hover:bg-surface-elevated hover:text-fg'
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
                  : 'text-fg-tertiary hover:bg-surface-elevated hover:text-fg'
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
          className="h-7 px-3 text-xs text-fg-tertiary"
          onClick={hash.clear}
          disabled={!hash.input && !hash.result}
        >
          Clear
        </Button>

        <button
          type="button"
          className="rounded p-1 text-fg-tertiary hover:bg-surface-elevated hover:text-fg-secondary"
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
          className="flex items-start gap-2 border-b border-red-900/60 bg-red-950/40 px-4 py-2 text-xs text-red-400"
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
            <span className="text-[11px] font-medium uppercase tracking-wide text-fg-tertiary">
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
              className="h-32 w-full resize-none rounded-md border border-edge bg-surface-raised p-3 font-mono text-sm text-fg placeholder-fg-muted focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
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
              {hash.isHashing && <span className="text-fg-muted">Hashing…</span>}
            </div>
          )}
        </div>

        {/* Output section */}
        {hash.isHashing && hash.result === null && (
          <div className="flex items-center gap-2 text-xs text-fg-tertiary">
            <span className="inline-block h-3 w-3 animate-spin rounded-full border border-surface-elevated border-t-accent-500" />
            Hashing…
          </div>
        )}

        {hash.result !== null && !isHashError(hash.result) && (
          <div className="flex flex-col gap-0 overflow-hidden rounded-md border border-edge">
            {/* Hex row */}
            <div className="flex items-center gap-3 border-b border-edge bg-surface-raised/60 px-4 py-3">
              <span className="w-14 shrink-0 text-[11px] font-semibold uppercase tracking-wide text-fg-tertiary">
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
              <span className="w-14 shrink-0 text-[11px] font-semibold uppercase tracking-wide text-fg-tertiary">
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
            <p className="text-sm text-fg-muted">Type text above to generate a hash</p>
            <p className="text-xs text-fg-muted">
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
  );
}
