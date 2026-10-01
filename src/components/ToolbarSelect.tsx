export interface ToolbarSelectOption<T extends string | number> {
  value: T;
  label: string;
}

export interface ToolbarSelectProps<T extends string | number> {
  id: string;
  label: string;
  value: T;
  options: readonly ToolbarSelectOption<T>[];
  onChange: (value: T) => void;
}

/**
 * Labelled native select for formatter toolbars. The label and select share one
 * non-wrapping flex item so a narrow toolbar can't break a line between them.
 */
export function ToolbarSelect<T extends string | number>({
  id,
  label,
  value,
  options,
  onChange,
}: ToolbarSelectProps<T>) {
  return (
    <div className="flex items-center gap-1.5 whitespace-nowrap">
      <label htmlFor={id} className="text-xs text-fg-secondary">
        {label}
      </label>
      <select
        id={id}
        value={String(value)}
        onChange={(e) => {
          // Native selects only yield strings; map back to the typed option value.
          const selected = options.find((o) => String(o.value) === e.target.value);
          if (selected) onChange(selected.value);
        }}
        className="rounded border border-edge-emphasis bg-surface-raised px-2 py-1 text-xs text-fg focus:border-accent-500 focus:outline-none"
      >
        {options.map((o) => (
          <option key={String(o.value)} value={String(o.value)}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
