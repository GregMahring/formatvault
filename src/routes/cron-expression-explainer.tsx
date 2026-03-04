import type { Route } from './+types/cron-expression-explainer';
import { buildMeta } from '@/lib/meta';
import { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useRegisterCommands } from '@/hooks/useRegisterCommands';
import { type Command } from '@/stores/commandStore';
import { KeyboardShortcutsModal } from '@/components/KeyboardShortcutsModal';
import {
  parseCron,
  isCronError,
  CRON_PRESETS,
  buildExpression,
  DEFAULT_BUILDER_STATE,
  type CronExpression,
  type BuilderMode,
  type BuilderState,
} from '@/features/tools/cronExplainer';
import { cn } from '@/lib/utils';
import { CalendarClock, Copy, Check, Keyboard } from 'lucide-react';

export { RouteErrorBoundary as ErrorBoundary } from '@/components/RouteErrorBoundary';

export function meta(_args: Route.MetaArgs) {
  return buildMeta({
    title: 'Cron Expression Explainer & Generator',
    description:
      'Explain cron expressions in plain English, or build one visually. See next run times, field-by-field breakdown, and common presets. 100% client-side.',
    path: '/cron-expression-explainer',
  });
}

// ── Date formatting ───────────────────────────────────────────────────────────

const localFormatter = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  timeZoneName: 'short',
});

const relativeFormatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

function formatRelative(date: Date): string {
  const diffMs = date.getTime() - Date.now();
  const abs = Math.abs(diffMs);
  if (abs < 60_000) return relativeFormatter.format(Math.round(diffMs / 1000), 'second');
  if (abs < 3_600_000) return relativeFormatter.format(Math.round(diffMs / 60_000), 'minute');
  if (abs < 86_400_000) return relativeFormatter.format(Math.round(diffMs / 3_600_000), 'hour');
  if (abs < 30 * 86_400_000)
    return relativeFormatter.format(Math.round(diffMs / 86_400_000), 'day');
  if (abs < 365 * 86_400_000)
    return relativeFormatter.format(Math.round(diffMs / (30 * 86_400_000)), 'month');
  return relativeFormatter.format(Math.round(diffMs / (365 * 86_400_000)), 'year');
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function NextRunRow({ index, date }: { index: number; date: Date }) {
  const { copy, copied } = useCopyToClipboard();
  const formatted = localFormatter.format(date);
  const relative = formatRelative(date);
  return (
    <tr className="border-b border-gray-800 last:border-0">
      <td className="w-6 py-2.5 pr-3 text-right text-[11px] font-medium text-gray-600">{index}</td>
      <td className="py-2.5 pr-2">
        <div className="font-mono text-xs text-gray-200">{formatted}</div>
        <div className="mt-0.5 text-[10px] text-gray-600">{relative}</div>
      </td>
      <td className="w-8 py-2.5 align-top">
        <button
          type="button"
          onClick={() => {
            void copy(formatted);
          }}
          className="rounded p-1 text-gray-700 transition-colors hover:bg-gray-800 hover:text-gray-400"
          aria-label={`Copy run ${String(index)} timestamp`}
          title="Copy"
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

const FIELD_LABELS: { key: keyof CronExpression; label: string; range: string }[] = [
  { key: 'minute', label: 'Minute', range: '0–59' },
  { key: 'hour', label: 'Hour', range: '0–23' },
  { key: 'dayOfMonth', label: 'Day of month', range: '1–31' },
  { key: 'month', label: 'Month', range: '1–12' },
  { key: 'dayOfWeek', label: 'Day of week', range: '0–7 (0=Sun)' },
];

function FieldTable({ expr }: { expr: CronExpression }) {
  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="border-b border-gray-800">
          <th className="py-1.5 pr-4 text-left text-[11px] font-medium uppercase tracking-wide text-gray-600">
            Field
          </th>
          <th className="py-1.5 pr-4 text-left text-[11px] font-medium uppercase tracking-wide text-gray-600">
            Value
          </th>
          <th className="py-1.5 text-left text-[11px] font-medium uppercase tracking-wide text-gray-600">
            Meaning
          </th>
        </tr>
      </thead>
      <tbody>
        {FIELD_LABELS.map(({ key, label, range }) => {
          const field = expr[key];
          if (!field || typeof field === 'string') return null;
          return (
            <tr key={key} className="border-b border-gray-800 last:border-0">
              <td className="py-2 pr-4 text-gray-500">
                {label}
                <span className="ml-1.5 text-[10px] text-gray-700">{range}</span>
              </td>
              <td className="py-2 pr-4 font-mono text-gray-300">{field.raw}</td>
              <td className="py-2 text-gray-400">{field.description}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ── Select helper ─────────────────────────────────────────────────────────────

function FieldSelect({
  value,
  onChange,
  options,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  options: { value: number; label: string }[];
  label: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => {
        onChange(Number(e.target.value));
      }}
      aria-label={label}
      className="rounded border border-gray-700 bg-gray-800 px-2 py-1 text-sm text-gray-200 focus:border-accent-500 focus:outline-none"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, i) => ({
  value: i,
  label: String(i).padStart(2, '0'),
}));

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label: String(i).padStart(2, '0'),
}));

const DOM_OPTIONS = Array.from({ length: 31 }, (_, i) => ({
  value: i + 1,
  label: String(i + 1),
}));

const STEP_OPTIONS = [2, 3, 4, 5, 10, 15, 20, 30].map((v) => ({
  value: v,
  label: String(v),
}));

const DOW_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const BUILDER_MODES: { mode: BuilderMode; label: string }[] = [
  { mode: 'every-minute', label: 'Every minute' },
  { mode: 'every-n-minutes', label: 'Every N minutes' },
  { mode: 'hourly', label: 'Hourly' },
  { mode: 'daily', label: 'Daily' },
  { mode: 'weekly', label: 'Weekly' },
  { mode: 'monthly', label: 'Monthly' },
  { mode: 'custom', label: 'Custom' },
];

// ── Cron builder ──────────────────────────────────────────────────────────────

function CronBuilder({
  state,
  onChange,
}: {
  state: BuilderState;
  onChange: (s: BuilderState) => void;
}) {
  const set = useCallback(
    (patch: Partial<BuilderState>) => {
      onChange({ ...state, ...patch });
    },
    [state, onChange]
  );

  const toggleDow = useCallback(
    (day: number) => {
      const next = state.daysOfWeek.includes(day)
        ? state.daysOfWeek.filter((d) => d !== day)
        : [...state.daysOfWeek, day];
      set({ daysOfWeek: next });
    },
    [state.daysOfWeek, set]
  );

  return (
    <div className="flex flex-col gap-5">
      {/* Mode selector */}
      <div>
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-gray-600">
          Schedule type
        </p>
        <div className="flex flex-wrap gap-1.5">
          {BUILDER_MODES.map(({ mode, label }) => (
            <button
              key={mode}
              type="button"
              onClick={() => {
                set({ mode });
              }}
              className={cn(
                'rounded border px-2.5 py-1 text-xs transition-colors',
                state.mode === mode
                  ? 'border-accent-600 bg-accent-600/20 text-accent-300'
                  : 'border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-600 hover:text-gray-200'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-3">
        {state.mode === 'every-minute' && (
          <p className="text-sm text-gray-500">Runs every minute, 24/7.</p>
        )}

        {state.mode === 'every-n-minutes' && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            Every
            <FieldSelect
              value={state.stepMinutes}
              onChange={(v) => {
                set({ stepMinutes: v });
              }}
              options={STEP_OPTIONS}
              label="Step minutes"
            />
            minutes
          </div>
        )}

        {state.mode === 'hourly' && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            At minute
            <FieldSelect
              value={state.minute}
              onChange={(v) => {
                set({ minute: v });
              }}
              options={MINUTE_OPTIONS}
              label="Minute"
            />
            of every hour
          </div>
        )}

        {(state.mode === 'daily' || state.mode === 'weekly' || state.mode === 'monthly') && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            At
            <FieldSelect
              value={state.hour}
              onChange={(v) => {
                set({ hour: v });
              }}
              options={HOUR_OPTIONS}
              label="Hour"
            />
            :
            <FieldSelect
              value={state.minute}
              onChange={(v) => {
                set({ minute: v });
              }}
              options={MINUTE_OPTIONS}
              label="Minute"
            />
          </div>
        )}

        {state.mode === 'weekly' && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">On</span>
            <div className="flex gap-1">
              {DOW_LABELS.map((label, i) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    toggleDow(i);
                  }}
                  className={cn(
                    'h-8 w-8 rounded text-xs font-medium transition-colors',
                    state.daysOfWeek.includes(i)
                      ? 'bg-accent-600 text-white'
                      : 'bg-gray-800 text-gray-500 hover:bg-gray-700 hover:text-gray-200'
                  )}
                  aria-pressed={state.daysOfWeek.includes(i)}
                  aria-label={DOW_LABELS[i]}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {state.mode === 'monthly' && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            On day
            <FieldSelect
              value={state.dayOfMonth}
              onChange={(v) => {
                set({ dayOfMonth: v });
              }}
              options={DOM_OPTIONS}
              label="Day of month"
            />
            of every month
          </div>
        )}

        {state.mode === 'custom' && (
          <div className="grid grid-cols-5 gap-2">
            {(
              [
                { key: 'customMinute', label: 'Minute', placeholder: '*', hint: '0–59' },
                { key: 'customHour', label: 'Hour', placeholder: '*', hint: '0–23' },
                { key: 'customDom', label: 'Day', placeholder: '*', hint: '1–31' },
                { key: 'customMonth', label: 'Month', placeholder: '*', hint: '1–12' },
                { key: 'customDow', label: 'Weekday', placeholder: '*', hint: '0–7' },
              ] as const
            ).map(({ key, label, placeholder, hint }) => (
              <div key={key} className="flex flex-col gap-1">
                <label className="text-[10px] text-gray-600">
                  {label}
                  <span className="block text-[9px] text-gray-700">{hint}</span>
                </label>
                <input
                  type="text"
                  value={state[key]}
                  onChange={(e) => {
                    set({ [key]: e.target.value });
                  }}
                  placeholder={placeholder}
                  className="w-full rounded border border-gray-700 bg-gray-800 px-2 py-1 font-mono text-sm text-gray-200 placeholder-gray-700 focus:border-accent-500 focus:outline-none"
                  spellCheck={false}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main route ────────────────────────────────────────────────────────────────

type ActiveTab = 'explain' | 'build';

export default function CronExpressionExplainer() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('explain');
  const [explainInput, setExplainInput] = useState('');
  const [builderState, setBuilderState] = useState<BuilderState>(DEFAULT_BUILDER_STATE);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const derivedExpression = useMemo(() => buildExpression(builderState), [builderState]);

  // The expression that drives the parser is either the typed input or the built expression
  const parserInput = activeTab === 'build' ? derivedExpression : explainInput;

  const result = useMemo(() => (parserInput.trim() ? parseCron(parserInput) : null), [parserInput]);

  const expression = result && !isCronError(result) ? result.expression : null;
  const nextRuns = result && !isCronError(result) ? result.nextRuns : null;
  const error = result && isCronError(result) ? result.error : null;

  const clear = useCallback(() => {
    if (activeTab === 'explain') {
      setExplainInput('');
    } else {
      setBuilderState(DEFAULT_BUILDER_STATE);
    }
  }, [activeTab]);

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

  const { copy: copyExpression, copied: expressionCopied } = useCopyToClipboard();

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-800 bg-gray-950 px-4 py-2">
        <CalendarClock className="h-4 w-4 text-gray-500" aria-hidden="true" />
        <h1 className="text-sm font-semibold text-gray-200">Cron Expression Explainer</h1>

        {/* Tab toggle */}
        <div className="ml-3 flex rounded border border-gray-800 bg-gray-900 p-0.5">
          {(['explain', 'build'] as ActiveTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setActiveTab(tab);
              }}
              className={cn(
                'rounded px-3 py-0.5 text-xs font-medium transition-colors',
                activeTab === tab
                  ? 'bg-gray-700 text-gray-100'
                  : 'text-gray-500 hover:text-gray-300'
              )}
            >
              {tab === 'explain' ? 'Explain' : 'Build'}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-3 text-xs text-gray-500"
          onClick={clear}
          disabled={activeTab === 'explain' ? !explainInput : false}
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
        {/* ── Explain tab ───────────────────────────────────────────── */}
        {activeTab === 'explain' && (
          <section>
            <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              Expression
            </h2>

            <div className="flex items-center gap-2">
              <div className="flex items-center">
                <span className="select-none rounded-l border border-r-0 border-gray-700 bg-gray-900 px-2.5 py-1.5 font-mono text-sm text-gray-600">
                  ⏱
                </span>
                <input
                  type="text"
                  value={explainInput}
                  onChange={(e) => {
                    setExplainInput(e.target.value);
                  }}
                  placeholder="* * * * *"
                  className="w-64 rounded-none rounded-r border border-gray-700 bg-gray-900 px-3 py-1.5 font-mono text-sm text-gray-200 placeholder-gray-600 focus:border-accent-500 focus:outline-none"
                  aria-label="Cron expression"
                  spellCheck={false}
                  autoComplete="off"
                />
              </div>
              <div className="hidden items-center gap-3 sm:flex">
                {['min', 'hr', 'dom', 'mon', 'dow'].map((f) => (
                  <span key={f} className="text-[10px] text-gray-700">
                    {f}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {CRON_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => {
                    setExplainInput(preset.value);
                  }}
                  className={cn(
                    'rounded border border-gray-800 bg-gray-900 px-2 py-0.5 text-[11px] transition-colors hover:border-gray-700 hover:text-gray-300',
                    explainInput === preset.value
                      ? 'border-accent-700 text-accent-400'
                      : 'text-gray-500'
                  )}
                  title={preset.description}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {!explainInput.trim() && (
              <p className="mt-4 text-xs text-gray-700">
                Enter a cron expression or pick a preset. Supports{' '}
                <code className="rounded border border-gray-800 bg-gray-900 px-1 text-[10px] text-gray-500">
                  @shortcuts
                </code>
                , named months{' '}
                <code className="rounded border border-gray-800 bg-gray-900 px-1 text-[10px] text-gray-500">
                  jan–dec
                </code>
                , and day names{' '}
                <code className="rounded border border-gray-800 bg-gray-900 px-1 text-[10px] text-gray-500">
                  mon–sun
                </code>
                .
              </p>
            )}
          </section>
        )}

        {/* ── Build tab ─────────────────────────────────────────────── */}
        {activeTab === 'build' && (
          <section>
            <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              Builder
            </h2>
            <div className="rounded-lg border border-gray-800 bg-gray-900/60 p-4">
              <CronBuilder state={builderState} onChange={setBuilderState} />

              {/* Generated expression */}
              <div className="mt-5 border-t border-gray-800 pt-4">
                <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-gray-600">
                  Generated expression
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded border border-gray-700 bg-gray-950 px-3 py-1.5 font-mono text-sm text-accent-300">
                    {derivedExpression}
                  </code>
                  <button
                    type="button"
                    onClick={() => {
                      void copyExpression(derivedExpression);
                    }}
                    className="flex items-center gap-1.5 rounded border border-gray-700 bg-gray-800 px-2.5 py-1.5 text-xs text-gray-400 transition-colors hover:border-gray-600 hover:text-gray-200"
                    aria-label="Copy expression"
                  >
                    {expressionCopied ? (
                      <Check className="h-3 w-3 text-green-400" aria-hidden="true" />
                    ) : (
                      <Copy className="h-3 w-3" aria-hidden="true" />
                    )}
                    {expressionCopied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── Error ─────────────────────────────────────────────────── */}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded border border-red-900/60 bg-red-950/40 px-3 py-2 text-xs text-red-400"
          >
            {error}
          </div>
        )}

        {/* ── Results (shared) ──────────────────────────────────────── */}
        {expression && (
          <>
            <section>
              <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                In plain English
              </h2>
              <div className="rounded-lg border border-gray-800 bg-gray-900 px-4 py-3">
                <p className="text-base font-semibold text-gray-100">{expression.summary}</p>
              </div>
            </section>

            <div className="grid gap-6 lg:grid-cols-2">
              <section>
                <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  Field breakdown
                </h2>
                <div className="overflow-hidden rounded-lg border border-gray-800 bg-gray-900 px-4 py-2">
                  <FieldTable expr={expression} />
                </div>
              </section>

              <section>
                <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  Next 5 runs
                  <span className="ml-2 text-[10px] font-normal text-gray-700">(local time)</span>
                </h2>
                {nextRuns && nextRuns.length > 0 ? (
                  <div className="overflow-hidden rounded-lg border border-gray-800 bg-gray-900 px-4 py-1">
                    <table className="w-full">
                      <tbody>
                        {nextRuns.map((date, i) => (
                          <NextRunRow key={date.getTime()} index={i + 1} date={date} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="rounded-lg border border-gray-800 bg-gray-900 px-4 py-3 text-xs text-gray-600">
                    No upcoming runs found in the next 5 years.
                  </div>
                )}
              </section>
            </div>
          </>
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
