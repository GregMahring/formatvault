import type { Route } from './+types/number-base-converter';
import { buildMeta } from '@/lib/meta';
import { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useRegisterCommands } from '@/hooks/useRegisterCommands';
import { type Command } from '@/stores/commandStore';
import { KeyboardShortcutsModal } from '@/components/KeyboardShortcutsModal';
import {
  convertNumber,
  isNumberError,
  formatWithPrefix,
  toAllBases,
  BASES,
  type NumberBase,
} from '@/features/tools/numberBaseConverter';
import { cn } from '@/lib/utils';
import { Binary, Copy, Check, Keyboard } from 'lucide-react';

export { RouteErrorBoundary as ErrorBoundary } from '@/components/RouteErrorBoundary';

export function meta(_args: Route.MetaArgs) {
  return buildMeta({
    title: 'Number Base Converter — Binary, Octal, Decimal, Hex',
    description:
      'Convert numbers between binary (base 2), octal (base 8), decimal (base 10), and hexadecimal (base 16). Supports negative integers and arbitrarily large values. 100% client-side.',
    path: '/number-base-converter',
  });
}

// ── Base input row ────────────────────────────────────────────────────────────

interface BaseRowProps {
  label: string;
  prefix: string;
  placeholder: string;
  value: string;
  base: NumberBase;
  hasError: boolean;
  onChange: (base: NumberBase, value: string) => void;
}

function BaseRow({ label, prefix, placeholder, value, base, hasError, onChange }: BaseRowProps) {
  const { copy, copied } = useCopyToClipboard();
  const copyValue = formatWithPrefix(value, base);

  return (
    <div className="flex items-center gap-3 border-b border-gray-800 py-3 last:border-0">
      <span className="w-10 shrink-0 text-[11px] font-semibold uppercase tracking-wider text-gray-600">
        {label}
      </span>

      <div className="flex min-w-0 flex-1 items-center">
        {prefix && (
          <span className="select-none rounded-l border border-r-0 border-gray-700 bg-gray-900 px-2 py-1.5 font-mono text-sm text-gray-600">
            {prefix}
          </span>
        )}
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(base, e.target.value);
          }}
          placeholder={placeholder}
          spellCheck={false}
          autoComplete="off"
          aria-label={`${label} value`}
          className={cn(
            'min-w-0 flex-1 bg-gray-900 px-3 py-1.5 font-mono text-sm text-gray-100 placeholder-gray-700 focus:outline-none focus:ring-1',
            prefix
              ? 'rounded-r border border-gray-700 focus:ring-accent-500'
              : 'rounded border border-gray-700 focus:ring-accent-500',
            hasError && value ? 'border-red-800 focus:ring-red-700' : ''
          )}
        />
      </div>

      <button
        type="button"
        onClick={() => {
          if (copyValue) void copy(copyValue);
        }}
        disabled={!value}
        className="flex shrink-0 items-center gap-1.5 rounded border border-gray-700 bg-gray-800 px-2.5 py-1 text-xs text-gray-400 transition-colors hover:border-gray-600 hover:text-gray-200 disabled:cursor-not-allowed disabled:opacity-30"
        aria-label={`Copy ${label} value`}
      >
        {copied ? (
          <>
            <Check className="h-3 w-3 text-green-400" aria-hidden="true" />
            <span className="text-green-400">Copied!</span>
          </>
        ) : (
          <>
            <Copy className="h-3 w-3" aria-hidden="true" />
            Copy
          </>
        )}
      </button>
    </div>
  );
}

// ── Main route ────────────────────────────────────────────────────────────────

const EMPTY_VALUES: Record<NumberBase, string> = { 2: '', 8: '', 10: '', 16: '' };

export default function NumberBaseConverter() {
  const [displayValues, setDisplayValues] = useState<Record<NumberBase, string>>(EMPTY_VALUES);
  const [error, setError] = useState<string | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const isEmpty = Object.values(displayValues).every((v) => !v);

  const handleChange = useCallback((base: NumberBase, raw: string) => {
    // Always update the field being edited
    setDisplayValues((prev) => ({ ...prev, [base]: raw }));

    if (!raw.trim()) {
      // If all fields would be empty, clear everything
      setDisplayValues(EMPTY_VALUES);
      setError(null);
      return;
    }

    const result = convertNumber(raw, base);
    if (isNumberError(result)) {
      setError(result.error);
    } else {
      setError(null);
      // Update all other bases, keep the edited field as the user typed it
      setDisplayValues({ ...result.values, [base]: raw });
    }
  }, []);

  const clear = useCallback(() => {
    setDisplayValues(EMPTY_VALUES);
    setError(null);
  }, []);

  // Quick-entry presets
  const applyPreset = useCallback((value: bigint) => {
    setDisplayValues(toAllBases(value));
    setError(null);
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

  const PRESETS: { label: string; value: bigint }[] = [
    { label: '0', value: 0n },
    { label: '255', value: 255n },
    { label: '256', value: 256n },
    { label: '1023', value: 1023n },
    { label: '65535', value: 65535n },
    { label: '2³²−1', value: 4294967295n },
  ];

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-800 bg-gray-950 px-4 py-2">
        <Binary className="h-4 w-4 text-gray-500" aria-hidden="true" />
        <h1 className="text-sm font-semibold text-gray-200">Number Base Converter</h1>

        <div className="flex-1" />

        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-3 text-xs text-gray-500"
          onClick={clear}
          disabled={isEmpty}
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

      {/* Main content */}
      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-6">
        {/* ── Inputs ────────────────────────────────────────────────── */}
        <section>
          <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
            Number
          </h2>
          <div className="overflow-hidden rounded-lg border border-gray-800 bg-gray-900 px-4">
            {BASES.map(({ base, label, prefix, placeholder }) => (
              <BaseRow
                key={base}
                label={label}
                prefix={prefix}
                placeholder={placeholder}
                value={displayValues[base]}
                base={base}
                hasError={!!error}
                onChange={handleChange}
              />
            ))}
          </div>

          {error && (
            <p role="alert" className="mt-2 text-xs text-red-400">
              {error}
            </p>
          )}
        </section>

        {/* ── Presets ───────────────────────────────────────────────── */}
        <section>
          <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
            Common values
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((preset) => (
              <button
                key={String(preset.value)}
                type="button"
                onClick={() => {
                  applyPreset(preset.value);
                }}
                className={cn(
                  'rounded border px-2.5 py-1 text-xs transition-colors',
                  displayValues[10] === String(preset.value)
                    ? 'border-accent-700 bg-accent-600/20 text-accent-300'
                    : 'border-gray-700 bg-gray-900 text-gray-500 hover:border-gray-600 hover:text-gray-200'
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </section>

        {isEmpty && !error && (
          <p className="text-xs text-gray-700">
            Type a number in any field — all bases update live. Supports negative integers and
            arbitrarily large values.
          </p>
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
