import { useEffect, useCallback } from 'react';
import type { Route } from './+types/csv-formatter';
import { SplitPane } from '@/components/SplitPane';
import { CodeEditor } from '@/components/CodeEditor';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCsvFormatter } from '@/features/csv/useCsvFormatter';
import type { Delimiter } from '@/features/csv/csvFormatter';

export function meta(_args: Route.MetaArgs) {
  return [
    { title: 'CSV Formatter & Validator — formatvault' },
    {
      name: 'description',
      content:
        'Free online CSV formatter and validator. Format and validate CSV with automatic delimiter detection (comma, tab, pipe, semicolon). 100% client-side.',
    },
    { property: 'og:title', content: 'CSV Formatter & Validator — formatvault' },
    {
      property: 'og:description',
      content:
        'Format and validate CSV online. Auto-detects delimiters. No data leaves your browser.',
    },
  ];
}

const DELIMITERS: { value: Delimiter; label: string }[] = [
  { value: 'auto', label: 'Auto' },
  { value: ',', label: 'Comma' },
  { value: '\t', label: 'Tab' },
  { value: '|', label: 'Pipe' },
  { value: ';', label: 'Semicolon' },
];

export default function CsvFormatter() {
  const fmt = useCsvFormatter();

  // Auto-process on input change with debounce
  useEffect(() => {
    if (!fmt.input.trim()) return;
    const timer = setTimeout(() => {
      fmt.process();
    }, 400);
    return () => {
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fmt.input, fmt.delimiter, fmt.hasHeader]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        fmt.process();
      }
    },
    [fmt]
  );

  const hasError = fmt.error !== null;

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div className="flex h-full flex-col" onKeyDown={handleKeyDown}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-800 bg-gray-950 px-4 py-2">
        <h1 className="text-sm font-semibold text-gray-200">CSV Formatter</h1>

        <div className="h-4 w-px bg-gray-800" aria-hidden="true" />

        {/* Delimiter selector */}
        <label htmlFor="delimiter-select" className="text-xs text-gray-400">
          Delimiter
        </label>
        <select
          id="delimiter-select"
          value={fmt.delimiter}
          onChange={(e) => {
            fmt.setDelimiter(e.target.value as Delimiter);
          }}
          className="rounded border border-gray-700 bg-gray-900 px-2 py-1 text-xs text-gray-200 focus:border-accent-500 focus:outline-none"
        >
          {DELIMITERS.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>

        <div className="h-4 w-px bg-gray-800" aria-hidden="true" />

        <label className="flex cursor-pointer items-center gap-1.5 text-xs text-gray-400">
          <input
            type="checkbox"
            className="h-3 w-3 accent-accent-500"
            checked={fmt.hasHeader}
            onChange={(e) => {
              fmt.setHasHeader(e.target.checked);
            }}
          />
          Header row
        </label>

        <div className="flex-1" />

        {/* Stats */}
        {fmt.rowCount > 0 && (
          <Badge variant="secondary" className="text-xs">
            {String(fmt.rowCount)} rows × {String(fmt.columnCount)} cols
            {fmt.detectedDelimiter && fmt.delimiter === 'auto'
              ? ` · detected: ${fmt.detectedDelimiter === '\t' ? 'tab' : fmt.detectedDelimiter}`
              : ''}
          </Badge>
        )}

        {fmt.input.trim() && !hasError && (
          <Badge variant="default" className="text-xs">
            ✓ Valid
          </Badge>
        )}
        {hasError && (
          <Badge variant="destructive" className="text-xs">
            ✗ Invalid
          </Badge>
        )}

        <Button
          size="sm"
          variant="outline"
          className="h-7 px-3 text-xs"
          onClick={fmt.process}
          disabled={!fmt.input.trim()}
        >
          Format
          <kbd className="ml-1 rounded bg-gray-800 px-1 text-[10px] text-gray-500">⌘↵</kbd>
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-3 text-xs text-gray-500"
          onClick={fmt.clear}
          disabled={!fmt.input.trim()}
        >
          Clear
        </Button>
      </div>

      {/* Error bar */}
      {hasError && (
        <div
          role="alert"
          className="flex items-start gap-2 border-b border-red-900/60 bg-red-950/40 px-4 py-2 text-xs text-red-400"
        >
          <span className="shrink-0 font-mono font-semibold">Error</span>
          <span className="flex-1">{fmt.error}</span>
        </div>
      )}

      {/* Warning bar */}
      {fmt.warning && !hasError && (
        <div
          role="status"
          className="flex items-start gap-2 border-b border-yellow-900/60 bg-yellow-950/30 px-4 py-2 text-xs text-yellow-400"
        >
          <span className="shrink-0 font-mono font-semibold">Warning</span>
          <span className="flex-1">{fmt.warning}</span>
        </div>
      )}

      {/* Split pane */}
      <div className="flex min-h-0 flex-1">
        <SplitPane leftLabel="CSV input editor" rightLabel="Formatted output" className="flex-1">
          {/* Left: input */}
          <div className="flex h-full flex-col">
            <div className="flex items-center border-b border-gray-800 px-3 py-1">
              <span className="text-[11px] font-medium uppercase tracking-wide text-gray-600">
                Input
              </span>
            </div>
            <CodeEditor
              value={fmt.input}
              onChange={fmt.setInput}
              language="csv"
              label="CSV input"
              placeholder="Paste or type CSV here…"
              className="flex-1 rounded-none border-0"
              minHeight="100%"
            />
          </div>

          {/* Right: output */}
          <div className="flex h-full flex-col">
            <div className="flex items-center border-b border-gray-800 px-3 py-1">
              <span className="text-[11px] font-medium uppercase tracking-wide text-gray-600">
                Output
              </span>
            </div>
            <CodeEditor
              value={fmt.output}
              language="csv"
              label="Formatted CSV output"
              readOnly
              placeholder="Formatted output will appear here…"
              className="flex-1 rounded-none border-0"
              minHeight="100%"
            />
          </div>
        </SplitPane>
      </div>
    </div>
  );
}
