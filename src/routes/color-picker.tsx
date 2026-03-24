import type { Route } from './+types/color-picker';
import { buildMeta } from '@/lib/meta';
import { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useRegisterCommands } from '@/hooks/useRegisterCommands';
import { type Command } from '@/stores/commandStore';
import { KeyboardShortcutsModal } from '@/components/KeyboardShortcutsModal';
import {
  parseColor,
  isColorError,
  cssHex,
  cssRgb,
  cssHsl,
  cssOklch,
  type ParsedColor,
} from '@/features/tools/colorConverter';
import { cn } from '@/lib/utils';
import { Pipette, Copy, Check, Keyboard } from 'lucide-react';

export { RouteErrorBoundary as ErrorBoundary } from '@/components/RouteErrorBoundary';

export function meta(_args: Route.MetaArgs) {
  return buildMeta({
    title: 'Color Picker & Converter — HEX, RGB, HSL, No Upload',
    description:
      'Pick and convert colors between HEX, RGB, HSL, and OKLCH formats privately in your browser — no data sent to any server. Copy CSS-ready values instantly.',
    path: '/color-picker',
  });
}

// ── Color value row ───────────────────────────────────────────────────────────

interface ColorValueRowProps {
  label: string;
  value: string;
}

function ColorValueRow({ label, value }: ColorValueRowProps) {
  const { copy, copied } = useCopyToClipboard();
  return (
    <div className="flex items-center gap-3 border-b border-edge py-3 last:border-0">
      <span className="w-14 shrink-0 text-[11px] font-semibold uppercase tracking-wider text-fg-secondary">
        {label}
      </span>
      <code className="flex-1 font-mono text-sm text-fg">{value}</code>
      <button
        type="button"
        onClick={() => {
          void copy(value);
        }}
        className="flex shrink-0 items-center gap-1.5 rounded border border-edge-emphasis bg-surface-elevated px-2.5 py-1 text-xs text-fg-secondary transition-colors hover:border-edge-emphasis hover:text-fg"
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

export default function ColorPicker() {
  const [textInput, setTextInput] = useState('');
  const [color, setColor] = useState<ParsedColor | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);

  // pickerHex stays in sync with current color for the native <input type="color">
  const pickerHex = color?.hex ?? '#3b82f6';

  const applyText = useCallback((raw: string) => {
    setTextInput(raw);
    if (!raw.trim()) {
      setColor(null);
      setInputError(null);
      return;
    }
    const result = parseColor(raw);
    if (isColorError(result)) {
      setInputError(result.error);
    } else {
      setColor(result);
      setInputError(null);
    }
  }, []);

  const onPickerChange = useCallback(
    (hex: string) => {
      applyText(hex);
    },
    [applyText]
  );

  const clear = useCallback(() => {
    setTextInput('');
    setColor(null);
    setInputError(null);
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

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-edge bg-surface px-4 py-2">
        <Pipette className="h-4 w-4 text-fg-tertiary" aria-hidden="true" />
        <h1 className="text-sm font-semibold text-fg">Color Picker</h1>

        <div className="flex-1" />

        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-3 text-xs text-fg-tertiary"
          onClick={clear}
          disabled={!textInput && !color}
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
        {/* ── Input section ─────────────────────────────────────────── */}
        <section>
          <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-fg-secondary">
            Color
          </h2>

          <div className="flex items-start gap-4">
            {/* Swatch + native picker */}
            <div
              className={cn(
                'relative h-16 w-16 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-edge-emphasis transition-colors',
                !color && 'bg-surface-elevated'
              )}
              style={color ? { backgroundColor: color.hex } : undefined}
              title="Click to open color picker"
            >
              <input
                type="color"
                value={pickerHex}
                onChange={(e) => {
                  onPickerChange(e.target.value);
                }}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                aria-label="Pick a color visually"
              />
            </div>

            {/* Text input */}
            <div className="flex flex-1 flex-col gap-1.5">
              <input
                type="text"
                value={textInput}
                onChange={(e) => {
                  applyText(e.target.value);
                }}
                placeholder="#3b82f6, rgb(59, 130, 246), hsl(217, 91%, 60%), oklch(…)"
                className={cn(
                  'w-full rounded border bg-surface-raised px-3 py-2 font-mono text-sm text-fg placeholder-fg-muted focus:outline-none',
                  inputError
                    ? 'border-red-800 focus:border-red-700'
                    : 'border-edge-emphasis focus:border-accent-500'
                )}
                spellCheck={false}
                autoComplete="off"
                aria-label="Color input"
              />
              {inputError ? (
                <p role="alert" className="text-xs text-red-400">
                  {inputError}
                </p>
              ) : (
                <p className="text-xs text-fg-muted">
                  Accepts hex, rgb(), hsl(), or oklch(). Click the swatch to use the native picker.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* ── Output section ────────────────────────────────────────── */}
        {color ? (
          <section>
            <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-fg-secondary">
              CSS Values
            </h2>
            <div className="overflow-hidden rounded-lg border border-edge bg-surface-raised px-4">
              <ColorValueRow label="HEX" value={cssHex(color)} />
              <ColorValueRow label="RGB" value={cssRgb(color)} />
              <ColorValueRow label="HSL" value={cssHsl(color)} />
              <ColorValueRow label="OKLCH" value={cssOklch(color)} />
            </div>
          </section>
        ) : (
          !inputError && (
            <p className="text-xs text-fg-muted">
              Enter a color above or click the swatch to get started.
            </p>
          )
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
