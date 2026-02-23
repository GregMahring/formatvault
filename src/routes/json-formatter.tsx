import { useEffect, useCallback } from 'react';
import type { Route } from './+types/json-formatter';
import { SplitPane } from '@/components/SplitPane';
import { CodeEditor } from '@/components/CodeEditor';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useJsonFormatter } from '@/features/json/useJsonFormatter';
import { cn } from '@/lib/utils';

export function meta(_args: Route.MetaArgs) {
  return [
    { title: 'JSON Formatter & Validator — formatvault' },
    {
      name: 'description',
      content:
        'Free online JSON formatter, validator and minifier. Pretty-print, minify, sort keys, query with JSONPath. Supports relaxed JSON5. 100% client-side.',
    },
    { property: 'og:title', content: 'JSON Formatter & Validator — formatvault' },
    {
      property: 'og:description',
      content: 'Format, validate and query JSON online. No data leaves your browser.',
    },
  ];
}

export default function JsonFormatter() {
  const fmt = useJsonFormatter();

  // Auto-process on input/option changes with 400ms debounce
  useEffect(() => {
    if (!fmt.input.trim()) return;
    if (fmt.isQueryMode) return;
    const timer = setTimeout(() => {
      fmt.process();
    }, 400);
    return () => {
      clearTimeout(timer);
    };
    // fmt.process is stable (useCallback), other deps are primitives
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fmt.input, fmt.mode, fmt.relaxed, fmt.sortKeys]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        if (fmt.isQueryMode) fmt.runQuery();
        else fmt.process();
      }
    },
    [fmt]
  );

  const hasError = fmt.error !== null;
  const isValid = fmt.validationResult === null && fmt.input.trim().length > 0;

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div className="flex h-full flex-col" onKeyDown={handleKeyDown}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-800 bg-gray-950 px-4 py-2">
        <h1 className="text-sm font-semibold text-gray-200">JSON Formatter</h1>

        <div className="h-4 w-px bg-gray-800" aria-hidden="true" />

        {/* Mode tabs */}
        <Tabs
          value={fmt.mode}
          onValueChange={(v) => {
            fmt.setMode(v as 'format' | 'minify' | 'validate');
          }}
        >
          <TabsList className="h-7">
            <TabsTrigger value="format" className="h-6 px-2 text-xs">
              Format
            </TabsTrigger>
            <TabsTrigger value="minify" className="h-6 px-2 text-xs">
              Minify
            </TabsTrigger>
            <TabsTrigger value="validate" className="h-6 px-2 text-xs">
              Validate
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="h-4 w-px bg-gray-800" aria-hidden="true" />

        {/* Options */}
        <label className="flex cursor-pointer items-center gap-1.5 text-xs text-gray-400">
          <input
            type="checkbox"
            className="h-3 w-3 accent-accent-500"
            checked={fmt.relaxed}
            onChange={(e) => {
              fmt.setRelaxed(e.target.checked);
            }}
          />
          JSON5
        </label>
        <label className="flex cursor-pointer items-center gap-1.5 text-xs text-gray-400">
          <input
            type="checkbox"
            className="h-3 w-3 accent-accent-500"
            checked={fmt.sortKeys}
            onChange={(e) => {
              fmt.setSortKeys(e.target.checked);
            }}
          />
          Sort keys
        </label>

        <div className="flex-1" />

        {/* Validation badge */}
        {fmt.input.trim() && (
          <Badge
            variant={isValid ? 'default' : hasError ? 'destructive' : 'secondary'}
            className="text-xs"
          >
            {isValid ? '✓ Valid' : hasError ? '✗ Invalid' : '—'}
          </Badge>
        )}

        {/* Actions */}
        <Button
          size="sm"
          variant="outline"
          className="h-7 px-3 text-xs"
          onClick={() => {
            if (fmt.isQueryMode) fmt.runQuery();
            else fmt.process();
          }}
          disabled={!fmt.input.trim()}
        >
          {fmt.isQueryMode ? 'Run query' : 'Format'}
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
          <span className="flex-1">{fmt.error?.error}</span>
          {fmt.error?.line && (
            <span className="ml-auto shrink-0 text-red-500/70">
              Line {String(fmt.error.line)}
              {fmt.error.column ? `:${String(fmt.error.column)}` : ''}
            </span>
          )}
        </div>
      )}

      {/* JSONPath bar */}
      {fmt.isQueryMode && (
        <div className="flex items-center gap-2 border-b border-gray-800 bg-gray-900/50 px-4 py-2">
          <label htmlFor="jsonpath-input" className="shrink-0 text-xs text-gray-400">
            JSONPath
          </label>
          <input
            id="jsonpath-input"
            type="text"
            value={fmt.jsonPath}
            onChange={(e) => {
              fmt.setJsonPath(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') fmt.runQuery();
            }}
            className="flex-1 rounded border border-gray-700 bg-gray-900 px-2 py-1 font-mono text-xs text-gray-200 placeholder-gray-600 focus:border-accent-500 focus:outline-none"
            placeholder="$.store.book[*].title"
          />
          <Button size="sm" variant="outline" className="h-7 px-3 text-xs" onClick={fmt.runQuery}>
            Run
          </Button>
        </div>
      )}

      {/* Split pane: input | output */}
      <div className="flex min-h-0 flex-1">
        <SplitPane leftLabel="JSON input editor" rightLabel="Formatted output" className="flex-1">
          {/* Left: input */}
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-gray-800 px-3 py-1">
              <span className="text-[11px] font-medium uppercase tracking-wide text-gray-600">
                Input
              </span>
              <button
                type="button"
                className={cn(
                  'text-[11px] text-gray-500 hover:text-gray-300',
                  fmt.isQueryMode && 'text-accent-400'
                )}
                onClick={() => {
                  fmt.setQueryMode(!fmt.isQueryMode);
                }}
              >
                {fmt.isQueryMode ? 'JSONPath ✓' : 'JSONPath'}
              </button>
            </div>
            <CodeEditor
              value={fmt.input}
              onChange={fmt.setInput}
              language="json"
              label="JSON input"
              placeholder="Paste or type JSON here…"
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
              language="json"
              label="Formatted JSON output"
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
