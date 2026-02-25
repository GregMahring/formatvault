import { useEffect, useCallback, useState } from 'react';
import type { Route } from './+types/json-formatter';
import { buildMeta } from '@/lib/meta';
import { SplitPane } from '@/components/SplitPane';
import { CodeEditor } from '@/components/CodeEditor';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileUploadZone } from '@/components/FileUploadZone';
import { PaneActions } from '@/components/PaneActions';
import { DiffPanel } from '@/components/DiffPanel';
import { MarkdownPreview } from '@/components/MarkdownPreview';
import { KeyboardShortcutsModal } from '@/components/KeyboardShortcutsModal';
import { ProgressBar } from '@/components/ProgressBar';
import { useJsonFormatter } from '@/features/json/useJsonFormatter';
import { useFileParser } from '@/hooks/useFileParser';
import { useKeyboardShortcuts, type Shortcut } from '@/hooks/useKeyboardShortcuts';
import { cn } from '@/lib/utils';
import { Keyboard } from 'lucide-react';

export { RouteErrorBoundary as ErrorBoundary } from '@/components/RouteErrorBoundary';

export function meta(_args: Route.MetaArgs) {
  return buildMeta({
    title: 'JSON Formatter & Validator',
    description:
      'Free online JSON formatter, validator and minifier. Pretty-print, minify, sort keys, query with JSONPath. Supports relaxed JSON5. 100% client-side.',
    path: '/json-formatter',
  });
}

export default function JsonFormatter() {
  const fmt = useJsonFormatter();
  const fileParser = useFileParser();
  const [showDiff, setShowDiff] = useState(false);
  const [showMarkdown, setShowMarkdown] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fmt.input, fmt.mode, fmt.relaxed, fmt.sortKeys]);

  // When file parse completes, load the text into the formatter input
  useEffect(() => {
    if (fileParser.result?.output) {
      fmt.setInput(fileParser.result.output);
    } else if (fileParser.result?.error) {
      // Surface worker/file errors via the formatter's error state
      fmt.setInput('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileParser.result]);

  const handleFileUpload = useCallback(
    (file: File) => {
      fileParser.parseFile(file, 'json');
    },
    [fileParser]
  );

  const shortcuts: Shortcut[] = [
    {
      label: 'Format / Run query',
      display: '⌘ ↵',
      key: 'Enter',
      meta: true,
      handler: () => {
        if (fmt.isQueryMode) fmt.runQuery();
        else fmt.process();
      },
    },
    {
      label: 'Toggle diff panel',
      display: '⌘ D',
      key: 'd',
      meta: true,
      handler: () => {
        setShowDiff((v) => !v);
        setShowMarkdown(false);
      },
    },
    {
      label: 'Toggle Markdown preview',
      display: '⌘ M',
      key: 'm',
      meta: true,
      handler: () => {
        setShowMarkdown((v) => !v);
        setShowDiff(false);
      },
    },
    {
      label: 'Toggle JSONPath mode',
      display: '⌘ J',
      key: 'j',
      meta: true,
      handler: () => {
        fmt.setQueryMode(!fmt.isQueryMode);
      },
    },
    {
      label: 'Clear input',
      display: '⌘ K',
      key: 'k',
      meta: true,
      handler: fmt.clear,
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

  const hasError = fmt.error !== null;
  const isValid = fmt.validationResult === null && fmt.input.trim().length > 0;

  return (
    <div className="flex h-full flex-col">
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

        {/* Diff toggle */}
        <button
          type="button"
          className={cn(
            'rounded px-2 py-1 text-xs transition-colors',
            showDiff
              ? 'bg-accent-700/40 text-accent-300'
              : 'text-gray-500 hover:bg-gray-800 hover:text-gray-300'
          )}
          onClick={() => {
            setShowDiff((v) => !v);
            setShowMarkdown(false);
          }}
          aria-pressed={showDiff}
        >
          Diff
        </button>

        {/* Markdown preview toggle */}
        <button
          type="button"
          className={cn(
            'rounded px-2 py-1 text-xs transition-colors',
            showMarkdown
              ? 'bg-accent-700/40 text-accent-300'
              : 'text-gray-500 hover:bg-gray-800 hover:text-gray-300'
          )}
          onClick={() => {
            setShowMarkdown((v) => !v);
            setShowDiff(false);
          }}
          aria-pressed={showMarkdown}
          title="Toggle Markdown preview (⌘M)"
        >
          Markdown
        </button>

        {/* Validation badge */}
        {fmt.input.trim() && (
          <Badge
            variant={isValid ? 'default' : hasError ? 'destructive' : 'secondary'}
            className="text-xs"
          >
            {isValid ? '✓ Valid' : hasError ? '✗ Invalid' : '—'}
          </Badge>
        )}

        {/* Format action */}
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

        {/* Shortcuts help */}
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

      {/* File parsing progress */}
      {fileParser.showProgress && fileParser.isParsing && (
        <ProgressBar percent={fileParser.progress} label="Parsing file…" />
      )}

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

      {/* File parse error */}
      {fileParser.result?.error && (
        <div
          role="alert"
          className="flex items-start gap-2 border-b border-red-900/60 bg-red-950/40 px-4 py-2 text-xs text-red-400"
        >
          <span className="shrink-0 font-mono font-semibold">File error</span>
          <span className="flex-1">{fileParser.result.error}</span>
        </div>
      )}

      {/* Curly-quote notice */}
      {fmt.normalisedQuotes && (
        <div
          role="status"
          className="flex items-center gap-2 border-b border-yellow-900/40 bg-yellow-950/30 px-4 py-1.5 text-xs text-yellow-400"
        >
          <span>
            ⚠ Smart/curly quotes were automatically converted to straight quotes before parsing.
          </span>
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

      {/* Main area: split pane OR diff panel OR markdown preview */}
      <div className="flex min-h-0 flex-1">
        {showDiff ? (
          <DiffPanel original={fmt.input} modified={fmt.output} className="flex-1" />
        ) : (
          <SplitPane
            leftLabel="JSON input editor"
            rightLabel={showMarkdown ? 'Markdown preview' : 'Formatted output'}
            className="flex-1"
          >
            {/* Left: input */}
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-gray-800 px-3 py-1">
                <span className="text-[11px] font-medium uppercase tracking-wide text-gray-600">
                  Input
                </span>
                <div className="flex items-center gap-1">
                  <FileUploadZone
                    accept=".json,application/json,.json5"
                    onFile={handleFileUpload}
                    disabled={fileParser.isParsing}
                  />
                  <button
                    type="button"
                    className={cn(
                      'rounded px-1.5 py-0.5 text-[11px] transition-colors hover:bg-gray-800',
                      fmt.isQueryMode ? 'text-accent-400' : 'text-gray-500 hover:text-gray-300'
                    )}
                    onClick={() => {
                      fmt.setQueryMode(!fmt.isQueryMode);
                    }}
                  >
                    {fmt.isQueryMode ? 'JSONPath ✓' : 'JSONPath'}
                  </button>
                </div>
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

            {/* Right: output or markdown preview */}
            {showMarkdown ? (
              <MarkdownPreview source={fmt.output || fmt.input} className="h-full" />
            ) : (
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b border-gray-800 px-3 py-1">
                  <span className="text-[11px] font-medium uppercase tracking-wide text-gray-600">
                    Output
                  </span>
                  <PaneActions content={fmt.output} downloadFilename="output.json" />
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
            )}
          </SplitPane>
        )}
      </div>

      {/* Keyboard shortcuts modal */}
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
