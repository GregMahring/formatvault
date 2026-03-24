import type { Route } from './+types/unix-timestamp-converter';
import { buildMeta } from '@/lib/meta';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useRegisterCommands } from '@/hooks/useRegisterCommands';
import { type Command } from '@/stores/commandStore';
import { KeyboardShortcutsModal } from '@/components/KeyboardShortcutsModal';
import {
  parseTimestamp,
  dateStringToTimestamps,
  nowSeconds,
  toDatetimeLocalValue,
  isTimestampError,
  detectUnit,
  type TimestampUnit,
  type TimestampBreakdown,
} from '@/features/tools/timestampConverter';
import { cn } from '@/lib/utils';
import { Clock, Copy, Check, Keyboard, RefreshCw } from 'lucide-react';

export { RouteErrorBoundary as ErrorBoundary } from '@/components/RouteErrorBoundary';

export function meta(_args: Route.MetaArgs) {
  return buildMeta({
    title: 'Unix Timestamp Converter — No Upload, 100% Private',
    description:
      'Convert Unix timestamps to human-readable dates and back privately in your browser — no data sent anywhere. Auto-detects seconds vs milliseconds. Shows UTC, ISO 8601, and relative time.',
    path: '/unix-timestamp-converter',
  });
}

// ── Result row component ────────────────────────────────────────────────────

function ResultRow({ label, value }: { label: string; value: string }) {
  const { copy, copied } = useCopyToClipboard();

  return (
    <tr className="border-b border-edge last:border-0">
      <td className="w-28 py-2.5 pr-4 align-top text-[11px] font-medium uppercase tracking-wide text-fg-tertiary">
        {label}
      </td>
      <td className="py-2.5 pr-2 font-mono text-xs text-fg break-all">{value}</td>
      <td className="w-8 py-2.5 align-top">
        <button
          type="button"
          onClick={() => {
            void copy(value);
          }}
          className="rounded p-1 text-fg-muted transition-colors hover:bg-surface-elevated hover:text-fg-secondary"
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

// ── Reverse copy row ────────────────────────────────────────────────────────

function TimestampCopyRow({ label, value }: { label: string; value: number }) {
  const { copy, copied } = useCopyToClipboard();
  const display = String(value);

  return (
    <div className="flex items-center gap-3">
      <span className="w-24 text-[11px] font-medium uppercase tracking-wide text-fg-tertiary">
        {label}
      </span>
      <span className="flex-1 font-mono text-sm text-fg">{display}</span>
      <button
        type="button"
        onClick={() => {
          void copy(display);
        }}
        className="rounded p-1 text-fg-muted transition-colors hover:bg-surface-elevated hover:text-fg-secondary"
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

// ── Main component ──────────────────────────────────────────────────────────

export default function UnixTimestampConverter() {
  const [input, setInput] = useState('');
  const [forceUnit, setForceUnit] = useState<TimestampUnit | undefined>(undefined);
  const [reverseInput, setReverseInput] = useState('');
  const [showShortcuts, setShowShortcuts] = useState(false);

  const result = useMemo(
    () => (input.trim() ? parseTimestamp(input, forceUnit) : null),
    [input, forceUnit]
  );

  const breakdown: TimestampBreakdown | null =
    result && !isTimestampError(result) ? result.breakdown : null;
  const error = result && isTimestampError(result) ? result.error : null;

  // Show the detected unit in the toggle
  const effectiveUnit =
    result && !isTimestampError(result)
      ? result.detectedUnit
      : (forceUnit ?? (input.trim() ? detectUnit(Number(input.trim())) : 'seconds'));

  const reverseResult = useMemo(() => dateStringToTimestamps(reverseInput), [reverseInput]);

  const handleNow = useCallback(() => {
    const ts = nowSeconds();
    setInput(ts);
    setForceUnit(undefined);
  }, []);

  const clear = useCallback(() => {
    setInput('');
    setForceUnit(undefined);
    setReverseInput('');
  }, []);

  // When a valid result exists, keep reverse input in sync
  useEffect(() => {
    if (breakdown) {
      setReverseInput(toDatetimeLocalValue(new Date(breakdown.milliseconds)));
    }
  }, [breakdown]);

  const shortcuts = [
    {
      label: 'Use current time',
      display: '⌘ ↵',
      key: 'Enter',
      meta: true,
      handler: handleNow,
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
        id: 'action:now',
        label: 'Use current time',
        group: 'Actions',
        shortcut: '⌘ ↵',
        handler: handleNow,
      },
      {
        id: 'action:clear',
        label: 'Clear',
        group: 'Actions',
        shortcut: '⌘ ⇧ K',
        handler: clear,
      },
    ],
    [handleNow, clear]
  );
  useRegisterCommands(commands);

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-edge bg-surface px-4 py-2">
        <Clock className="h-4 w-4 text-fg-tertiary" aria-hidden="true" />
        <h1 className="text-sm font-semibold text-fg">Unix Timestamp Converter</h1>

        <div className="flex-1" />

        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-3 text-xs text-fg-tertiary"
          onClick={clear}
          disabled={!input && !reverseInput}
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

      {/* Main content */}
      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-6">
        {/* ── Timestamp → Date ─────────────────────────────────── */}
        <section>
          <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-fg-secondary">
            Timestamp → Date
          </h2>

          {/* Input row */}
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              inputMode="numeric"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setForceUnit(undefined);
              }}
              placeholder="e.g. 1735689600"
              className="w-52 rounded border border-edge-emphasis bg-surface-raised px-3 py-1.5 font-mono text-sm text-fg placeholder-fg-muted focus:border-accent-500 focus:outline-none"
              aria-label="Unix timestamp"
              spellCheck={false}
            />

            {/* Seconds / ms toggle */}
            <div className="flex items-center rounded-md border border-edge bg-surface-raised p-0.5">
              {(['seconds', 'milliseconds'] as TimestampUnit[]).map((unit) => (
                <button
                  key={unit}
                  type="button"
                  onClick={() => {
                    setForceUnit(unit);
                  }}
                  className={cn(
                    'rounded px-2.5 py-1 text-xs transition-colors',
                    effectiveUnit === unit && input.trim()
                      ? 'bg-surface-elevated text-fg'
                      : 'text-fg-tertiary hover:text-fg'
                  )}
                  title={unit === 'seconds' ? 'Treat as seconds' : 'Treat as milliseconds'}
                >
                  {unit === 'seconds' ? 's' : 'ms'}
                </button>
              ))}
            </div>

            {/* Now button */}
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 px-3 text-xs"
              onClick={handleNow}
              title="Use current time (⌘↵)"
            >
              <RefreshCw className="h-3 w-3" aria-hidden="true" />
              Now
            </Button>

            {/* Auto-detect label */}
            {input.trim() && !forceUnit && result && !isTimestampError(result) && (
              <span className="text-[11px] text-fg-tertiary">
                auto-detected: {result.detectedUnit}
              </span>
            )}
          </div>

          {/* Error */}
          {error && (
            <div
              role="alert"
              className="mt-3 flex items-center gap-2 rounded border border-red-900/60 bg-red-950/40 px-3 py-2 text-xs text-red-400"
            >
              {error}
            </div>
          )}

          {/* Results table */}
          {breakdown && (
            <div className="mt-4 overflow-hidden rounded-lg border border-edge bg-surface-raised">
              <table className="w-full">
                <tbody>
                  <ResultRow label="UTC" value={breakdown.utc} />
                  <ResultRow label={breakdown.localTimezone} value={breakdown.local} />
                  <ResultRow label="ISO 8601" value={breakdown.iso} />
                  <ResultRow label="Relative" value={breakdown.relative} />
                  <ResultRow label="Unix (s)" value={String(breakdown.seconds)} />
                  <ResultRow label="Unix (ms)" value={String(breakdown.milliseconds)} />
                </tbody>
              </table>
            </div>
          )}

          {/* Empty state */}
          {!input.trim() && (
            <p className="mt-4 text-xs text-fg-muted">
              Paste a Unix timestamp above, or press{' '}
              <kbd className="rounded border border-edge bg-surface-raised px-1 py-px text-[10px]">
                ⌘↵
              </kbd>{' '}
              to use the current time.
            </p>
          )}
        </section>

        {/* ── Date → Timestamp ─────────────────────────────────── */}
        <section>
          <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-fg-secondary">
            Date → Timestamp
          </h2>

          <div className="flex flex-wrap items-center gap-3">
            <input
              type="datetime-local"
              value={reverseInput}
              onChange={(e) => {
                setReverseInput(e.target.value);
              }}
              className="rounded border border-edge-emphasis bg-surface-raised px-3 py-1.5 text-sm text-fg focus:border-accent-500 focus:outline-none [color-scheme:dark]"
              aria-label="Date and time"
            />
          </div>

          {reverseResult && (
            <div className="mt-4 flex flex-col gap-2 overflow-hidden rounded-lg border border-edge bg-surface-raised px-4 py-3">
              <TimestampCopyRow label="Unix (s)" value={reverseResult.seconds} />
              <TimestampCopyRow label="Unix (ms)" value={reverseResult.milliseconds} />
            </div>
          )}

          {!reverseInput && (
            <p className="mt-4 text-xs text-fg-muted">
              Pick a date and time to get the corresponding Unix timestamp.
            </p>
          )}
        </section>
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
