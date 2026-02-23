import { useEffect, useCallback } from 'react';
import type { Route } from './+types/yaml-formatter';
import { SplitPane } from '@/components/SplitPane';
import { CodeEditor } from '@/components/CodeEditor';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useYamlFormatter } from '@/features/yaml/useYamlFormatter';
import type { YamlIndent } from '@/features/yaml/yamlFormatter';

export function meta(_args: Route.MetaArgs) {
  return [
    { title: 'YAML Formatter & Validator — formatvault' },
    {
      name: 'description',
      content:
        'Free online YAML formatter and validator. Format and validate YAML with line-level error reporting. Supports multi-document YAML. 100% client-side.',
    },
    { property: 'og:title', content: 'YAML Formatter & Validator — formatvault' },
    {
      property: 'og:description',
      content:
        'Format and validate YAML online with line-level error reporting. No data leaves your browser.',
    },
  ];
}

export default function YamlFormatter() {
  const fmt = useYamlFormatter();

  // Auto-process on input/option changes with debounce
  useEffect(() => {
    if (!fmt.input.trim()) return;
    const timer = setTimeout(() => {
      fmt.process();
    }, 400);
    return () => {
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fmt.input, fmt.indent]);

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
  const isValid = !hasError && fmt.input.trim().length > 0;

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div className="flex h-full flex-col" onKeyDown={handleKeyDown}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-800 bg-gray-950 px-4 py-2">
        <h1 className="text-sm font-semibold text-gray-200">YAML Formatter</h1>

        <div className="h-4 w-px bg-gray-800" aria-hidden="true" />

        {/* Indent selector */}
        <label htmlFor="yaml-indent-select" className="text-xs text-gray-400">
          Indent
        </label>
        <select
          id="yaml-indent-select"
          value={fmt.indent}
          onChange={(e) => {
            fmt.setIndent(Number(e.target.value) as YamlIndent);
          }}
          className="rounded border border-gray-700 bg-gray-900 px-2 py-1 text-xs text-gray-200 focus:border-accent-500 focus:outline-none"
        >
          <option value={2}>2 spaces</option>
          <option value={4}>4 spaces</option>
        </select>

        <div className="flex-1" />

        {/* Multi-doc badge */}
        {fmt.documentCount > 1 && (
          <Badge variant="secondary" className="text-xs">
            {String(fmt.documentCount)} documents
          </Badge>
        )}

        {/* Validation badge */}
        {fmt.input.trim() && (
          <Badge variant={isValid ? 'default' : 'destructive'} className="text-xs">
            {isValid ? '✓ Valid' : '✗ Invalid'}
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
          <span className="flex-1">{fmt.error?.error}</span>
          {fmt.error?.line && (
            <span className="ml-auto shrink-0 text-red-500/70">Line {String(fmt.error.line)}</span>
          )}
        </div>
      )}

      {/* Split pane */}
      <div className="flex min-h-0 flex-1">
        <SplitPane leftLabel="YAML input editor" rightLabel="Formatted output" className="flex-1">
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
              language="yaml"
              label="YAML input"
              placeholder="Paste or type YAML here…"
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
              language="yaml"
              label="Formatted YAML output"
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
