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
  type BuilderState,
} from '@/features/tools/cronExplainer';
import { CronBuilder } from '@/features/tools/CronBuilder';
import { NextRunRow, FieldTable } from '@/features/tools/CronResultViews';
import { cn } from '@/lib/utils';
import { CalendarClock, Copy, Check, Keyboard } from 'lucide-react';

export { RouteErrorBoundary as ErrorBoundary } from '@/components/RouteErrorBoundary';

export function meta(_args: Route.MetaArgs) {
  return buildMeta({
    title: 'Cron Expression Explainer — No Upload, 100% Private',
    description:
      'Explain cron expressions in plain English and see next run times privately in your browser — no data sent anywhere. Field breakdown, visual builder, and common presets. 100% client-side.',
    path: '/cron-expression-explainer',
  });
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
      <div className="flex flex-wrap items-center gap-2 border-b border-edge bg-surface px-4 py-2">
        <CalendarClock className="h-4 w-4 text-fg-secondary" aria-hidden="true" />
        <h1 className="text-sm font-semibold text-label-indigo">Cron Expression Explainer</h1>

        {/* Tab toggle */}
        <div className="ml-3 flex rounded border border-edge bg-surface-raised p-0.5">
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
                  ? 'bg-surface-elevated text-fg'
                  : 'text-fg-secondary hover:text-fg'
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
          className="h-7 px-3 text-xs text-fg-secondary"
          onClick={clear}
          disabled={activeTab === 'explain' ? !explainInput : false}
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
      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-6">
        {/* ── Explain tab ───────────────────────────────────────────── */}
        {activeTab === 'explain' && (
          <section>
            <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-label-cyan">
              Expression
            </h2>

            <div className="flex items-center gap-2">
              <div className="flex items-center">
                <span className="select-none rounded-l border border-r-0 border-edge-emphasis bg-surface-raised px-2.5 py-1.5 font-mono text-sm text-fg-secondary">
                  ⏱
                </span>
                <input
                  type="text"
                  value={explainInput}
                  onChange={(e) => {
                    setExplainInput(e.target.value);
                  }}
                  placeholder="* * * * *"
                  className="w-64 rounded-none rounded-r border border-edge-emphasis bg-surface-raised px-3 py-1.5 font-mono text-sm text-fg placeholder:text-fg-secondary focus:border-accent-500 focus:outline-none"
                  aria-label="Cron expression"
                  spellCheck={false}
                  autoComplete="off"
                />
              </div>
              <div className="hidden items-center gap-3 sm:flex">
                {['min', 'hr', 'dom', 'mon', 'dow'].map((f) => (
                  <span key={f} className="text-[10px] text-fg-secondary">
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
                    'rounded border border-edge bg-surface-raised px-2 py-0.5 text-[11px] transition-colors hover:border-edge-emphasis hover:text-fg',
                    explainInput === preset.value
                      ? 'border-accent-700 text-accent-400'
                      : 'text-fg-secondary'
                  )}
                  title={preset.description}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {!explainInput.trim() && (
              <p className="mt-4 text-xs text-fg-secondary">
                Enter a cron expression or pick a preset. Supports{' '}
                <code className="rounded border border-edge bg-surface-raised px-1 text-[10px] text-fg-secondary">
                  @shortcuts
                </code>
                , named months{' '}
                <code className="rounded border border-edge bg-surface-raised px-1 text-[10px] text-fg-secondary">
                  jan–dec
                </code>
                , and day names{' '}
                <code className="rounded border border-edge bg-surface-raised px-1 text-[10px] text-fg-secondary">
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
            <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-fg-secondary">
              Builder
            </h2>
            <div className="rounded-lg border border-edge bg-surface-raised/60 p-4">
              <CronBuilder state={builderState} onChange={setBuilderState} />

              {/* Generated expression */}
              <div className="mt-5 border-t border-edge pt-4">
                <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-fg-secondary">
                  Generated expression
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded border border-edge-emphasis bg-surface px-3 py-1.5 font-mono text-sm text-accent-300">
                    {derivedExpression}
                  </code>
                  <button
                    type="button"
                    onClick={() => {
                      void copyExpression(derivedExpression);
                    }}
                    className="flex items-center gap-1.5 rounded border border-edge-emphasis bg-surface-elevated px-2.5 py-1.5 text-xs text-fg-secondary transition-colors hover:border-edge-emphasis hover:text-fg"
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
              <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-fg-secondary">
                In plain English
              </h2>
              <div className="rounded-lg border border-edge bg-surface-raised px-4 py-3">
                <p className="text-base font-semibold text-fg">{expression.summary}</p>
              </div>
            </section>

            <div className="grid gap-6 lg:grid-cols-2">
              <section>
                <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-fg-secondary">
                  Field breakdown
                </h2>
                <div className="overflow-hidden rounded-lg border border-edge bg-surface-raised px-4 py-2">
                  <FieldTable expr={expression} />
                </div>
              </section>

              <section>
                <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-fg-secondary">
                  Next 5 runs
                  <span className="ml-2 text-[10px] font-normal text-fg-secondary">
                    (local time)
                  </span>
                </h2>
                {nextRuns && nextRuns.length > 0 ? (
                  <div className="overflow-hidden rounded-lg border border-edge bg-surface-raised px-4 py-1">
                    <table className="w-full">
                      <tbody>
                        {nextRuns.map((date, i) => (
                          <NextRunRow key={date.getTime()} index={i + 1} date={date} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="rounded-lg border border-edge bg-surface-raised px-4 py-3 text-xs text-fg-secondary">
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
