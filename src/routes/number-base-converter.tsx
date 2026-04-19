import type { Route } from './+types/number-base-converter';
import { buildMeta } from '@/lib/meta';
import { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useRegisterCommands } from '@/hooks/useRegisterCommands';
import { type Command } from '@/stores/commandStore';
import { KeyboardShortcutsModal } from '@/components/KeyboardShortcutsModal';
import { ToolPageContent } from '@/components/ToolPageContent';
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
    title: 'Number Base Converter — Binary, Octal, Hex, No Upload',
    description:
      'Convert numbers between binary, octal, decimal, and hexadecimal privately in your browser — no data sent anywhere. Supports negative integers and large values. 100% client-side.',
    path: '/number-base-converter',
    faqItems: [
      {
        q: 'Which number bases are supported?',
        a: 'Binary (base 2), octal (base 8), decimal (base 10), and hexadecimal (base 16). Type a value in any field and all others update instantly.',
      },
      {
        q: 'What do the 0x and 0o prefixes mean?',
        a: '0x is the conventional prefix for hexadecimal values used in most programming languages. 0o is the octal prefix used in Python, JavaScript, and other modern languages. The converter copies these prefixes with the value when you click Copy.',
      },
      {
        q: 'Does it support large numbers?',
        a: 'Yes. The converter uses JavaScript BigInt internally, so there is no practical upper limit on the size of the number. It also handles negative integers in all four bases.',
      },
      {
        q: 'Why is 255 a common preset value?',
        a: '255 is 0xFF in hex and 11111111 in binary — the maximum value of an 8-bit unsigned integer. It appears frequently in networking (subnet masks), color values (RGB channels), and low-level programming.',
      },
      {
        q: 'Why is 65535 a preset?',
        a: '65535 is 0xFFFF — the maximum value of a 16-bit unsigned integer. It is the upper limit for port numbers, common in networking and embedded systems.',
      },
    ],
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
    <div className="flex items-center gap-3 border-b border-edge py-3 last:border-0">
      <span className="w-10 shrink-0 text-[11px] font-semibold uppercase tracking-wider text-fg-secondary">
        {label}
      </span>

      <div className="flex min-w-0 flex-1 items-center">
        {prefix && (
          <span className="select-none rounded-l border border-r-0 border-edge-emphasis bg-surface-raised px-2 py-1.5 font-mono text-sm text-fg-secondary">
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
            'min-w-0 flex-1 bg-surface-raised px-3 py-1.5 font-mono text-sm text-fg placeholder:text-fg-secondary focus:outline-none focus:ring-1',
            prefix
              ? 'rounded-r border border-edge-emphasis focus:ring-accent-500'
              : 'rounded border border-edge-emphasis focus:ring-accent-500',
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
        className="flex shrink-0 items-center gap-1.5 rounded border border-edge-emphasis bg-surface-elevated px-2.5 py-1 text-xs text-fg-secondary transition-colors hover:border-edge-emphasis hover:text-fg disabled:cursor-not-allowed disabled:opacity-30"
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
    <div className="flex flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-edge bg-surface px-4 py-2">
        <Binary className="h-4 w-4 text-fg-secondary" aria-hidden="true" />
        <h1 className="text-sm font-semibold text-label-indigo">Number Base Converter</h1>

        <div className="flex-1" />

        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-3 text-xs text-fg-secondary"
          onClick={clear}
          disabled={isEmpty}
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

      {/* Main content */}
      <div className="flex flex-col gap-6 p-6">
        {/* ── Inputs ────────────────────────────────────────────────── */}
        <section>
          <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-label-cyan">
            Number
          </h2>
          <div className="overflow-hidden rounded-lg border border-edge bg-surface-raised px-4">
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
          <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-label-cyan">
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
                    : 'border-edge-emphasis bg-surface-raised text-fg-secondary hover:border-edge-emphasis hover:text-fg'
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </section>

        {isEmpty && !error && (
          <p className="text-xs text-fg-secondary">
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

      <ToolPageContent
        toolName="number base converter"
        why={
          <div className="space-y-3 text-fg-secondary">
            <p>
              Developers constantly move between number bases — hex memory addresses in debuggers,
              binary register values in embedded systems, octal Unix file permissions, decimal port
              numbers. Mental arithmetic between bases is error-prone and slow. A dedicated
              converter eliminates that friction and reduces transcription mistakes.
            </p>
            <p>
              Most online converters require a form submission or show ads. This one updates all
              four bases simultaneously as you type, runs entirely in your browser, and handles
              integers of any size — including the large values that appear in networking and
              cryptography.
            </p>
          </div>
        }
        howItWorks={
          <div className="space-y-3 text-fg-secondary">
            <p>
              Type a value in any of the four fields — binary, octal, decimal, or hexadecimal — and
              the converter immediately parses it as a JavaScript BigInt and recomputes all other
              representations. BigInt has no upper size limit, so there are no overflow issues with
              large values like 64-bit integers or cryptographic constants.
            </p>
            <p>
              Negative numbers are supported in all bases. The Copy button on each row includes the
              conventional prefix —{' '}
              <code className="rounded px-1 py-0.5 font-mono text-[0.85em] text-label-cyan bg-label-cyan/8">
                0x
              </code>{' '}
              for hex,{' '}
              <code className="rounded px-1 py-0.5 font-mono text-[0.85em] text-label-cyan bg-label-cyan/8">
                0o
              </code>{' '}
              for octal — so you can paste directly into code.
            </p>
          </div>
        }
        useCases={[
          'Reading hex memory addresses in a debugger and converting to decimal for arithmetic',
          'Checking Unix file permission bits — e.g. confirming 755 in octal is 111 101 101 in binary',
          'Working with IPv4 subnet masks like 255.255.255.0 and understanding their binary structure',
          'Converting RGB color channel values between decimal and hex for CSS or design tools',
          'Inspecting 16-bit or 32-bit register values in embedded systems or microcontroller datasheets',
          'Understanding port number limits — 65535 is 0xFFFF, the maximum for a 16-bit unsigned integer',
          'Verifying bit flag values in low-level protocol implementations or network packet analysis',
        ]}
        faq={[
          {
            q: 'Which number bases are supported?',
            a: 'Binary (base 2), octal (base 8), decimal (base 10), and hexadecimal (base 16). Type a value in any field and all others update instantly — no submit button needed.',
          },
          {
            q: 'What do the 0x and 0o prefixes mean?',
            a: '0x is the conventional prefix for hexadecimal values used in C, JavaScript, Python, and most other languages. 0o is the octal prefix used in Python 3 and modern JavaScript. The Copy button on each row includes the prefix so you can paste directly into code.',
          },
          {
            q: 'Does it support large numbers?',
            a: 'Yes. The converter uses JavaScript BigInt internally, so there is no practical upper limit. It correctly handles 64-bit integers, cryptographic constants, and other values that overflow standard 32-bit or 53-bit representations.',
          },
          {
            q: 'Are negative numbers supported?',
            a: 'Yes. Prefix any value with a minus sign and the converter handles it correctly across all four bases.',
          },
          {
            q: 'Why are values like 255, 65535, and 4294967295 listed as presets?',
            a: '255 (0xFF) is the maximum 8-bit unsigned integer — the upper limit for a single byte, common in RGB color values and networking. 65535 (0xFFFF) is the maximum 16-bit value and the highest valid network port number. 4294967295 (0xFFFFFFFF) is the maximum 32-bit unsigned integer, which appears in IPv4 address arithmetic and 32-bit register values.',
          },
        ]}
      />
    </div>
  );
}
