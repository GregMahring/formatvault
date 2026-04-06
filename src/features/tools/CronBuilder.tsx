/* eslint-disable react-refresh/only-export-components -- builder option arrays intentionally co-located with CronBuilder */
import { useCallback } from 'react';
import { type BuilderMode, type BuilderState } from '@/features/tools/cronExplainer';
import { cn } from '@/lib/utils';

// ── FieldSelect ───────────────────────────────────────────────────────────────

export interface FieldSelectProps {
  value: number;
  onChange: (v: number) => void;
  options: { value: number; label: string }[];
  label: string;
}

export function FieldSelect({ value, onChange, options, label }: FieldSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => {
        onChange(Number(e.target.value));
      }}
      aria-label={label}
      className="rounded border border-edge-emphasis bg-surface-elevated px-2 py-1 text-sm text-fg focus:border-accent-500 focus:outline-none"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

// ── Builder constants ─────────────────────────────────────────────────────────

export const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, i) => ({
  value: i,
  label: String(i).padStart(2, '0'),
}));

export const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label: String(i).padStart(2, '0'),
}));

export const DOM_OPTIONS = Array.from({ length: 31 }, (_, i) => ({
  value: i + 1,
  label: String(i + 1),
}));

export const STEP_OPTIONS = [2, 3, 4, 5, 10, 15, 20, 30].map((v) => ({
  value: v,
  label: String(v),
}));

export const DOW_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const BUILDER_MODES: { mode: BuilderMode; label: string }[] = [
  { mode: 'every-minute', label: 'Every minute' },
  { mode: 'every-n-minutes', label: 'Every N minutes' },
  { mode: 'hourly', label: 'Hourly' },
  { mode: 'daily', label: 'Daily' },
  { mode: 'weekly', label: 'Weekly' },
  { mode: 'monthly', label: 'Monthly' },
  { mode: 'custom', label: 'Custom' },
];

// ── CronBuilder ───────────────────────────────────────────────────────────────

export interface CronBuilderProps {
  state: BuilderState;
  onChange: (s: BuilderState) => void;
}

export function CronBuilder({ state, onChange }: CronBuilderProps) {
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
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-fg-secondary">
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
                  : 'border-edge-emphasis bg-surface-raised text-fg-secondary hover:border-edge-emphasis hover:text-fg'
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
          <p className="text-sm text-fg-secondary">Runs every minute, 24/7.</p>
        )}

        {state.mode === 'every-n-minutes' && (
          <div className="flex items-center gap-2 text-sm text-fg-secondary">
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
          <div className="flex items-center gap-2 text-sm text-fg-secondary">
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
          <div className="flex items-center gap-2 text-sm text-fg-secondary">
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
            <span className="text-sm text-fg-secondary">On</span>
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
                      : 'bg-surface-elevated text-fg-secondary hover:bg-surface-raised hover:text-fg'
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
          <div className="flex items-center gap-2 text-sm text-fg-secondary">
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
                <label className="text-[10px] text-fg-secondary">
                  {label}
                  <span className="block text-[9px] text-fg-secondary">{hint}</span>
                </label>
                <input
                  type="text"
                  value={state[key]}
                  onChange={(e) => {
                    set({ [key]: e.target.value });
                  }}
                  placeholder={placeholder}
                  className="w-full rounded border border-edge-emphasis bg-surface-elevated px-2 py-1 font-mono text-sm text-fg placeholder:text-fg-secondary focus:border-accent-500 focus:outline-none"
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
