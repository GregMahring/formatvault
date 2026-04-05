import { useEffect, useCallback, useState, useMemo } from 'react';
import type { Route } from './+types/json-formatter';
import { buildMeta } from '@/lib/meta';
import { SplitPane } from '@/components/SplitPane';
import { CodeEditor } from '@/components/CodeEditor';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { FileUploadZone } from '@/components/FileUploadZone';
import { PaneActions } from '@/components/PaneActions';
import { PiiMaskToggle } from '@/components/PiiMaskToggle';
import { DiffPanel } from '@/components/DiffPanel';
import { MarkdownPreview } from '@/components/MarkdownPreview';
import { TreeView } from '@/components/TreeView';
import { KeyboardShortcutsModal } from '@/components/KeyboardShortcutsModal';
import { ProgressBar } from '@/components/ProgressBar';
import { useJsonFormatter } from '@/features/json/useJsonFormatter';
import { useSettingsStore } from '@/stores/settingsStore';
import { useFileParser } from '@/hooks/useFileParser';
import { usePreloadedInput } from '@/hooks/usePreloadedInput';
import { useKeyboardShortcuts, type Shortcut } from '@/hooks/useKeyboardShortcuts';
import { usePiiMasking } from '@/hooks/usePiiMasking';
import { useRegisterCommands } from '@/hooks/useRegisterCommands';
import { type Command } from '@/stores/commandStore';
import { ToolPageContent } from '@/components/ToolPageContent';
import { cn } from '@/lib/utils';
import { Keyboard } from 'lucide-react';

export { RouteErrorBoundary as ErrorBoundary } from '@/components/RouteErrorBoundary';

export function meta(_args: Route.MetaArgs) {
  return buildMeta({
    title: 'JSON Formatter & Validator — No Upload, 100% Private',
    description:
      'Format, validate and minify JSON privately in your browser — no data uploaded. Supports JSON5, JSONPath queries, diff view, sort keys, and files up to 500MB via streaming.',
    path: '/json-formatter',
    faqItems: [
      {
        q: 'Is my JSON data safe?',
        a: 'Yes. All processing happens in your browser tab. No data is sent to any server, logged, or stored anywhere. You can verify this by opening DevTools → Network and observing zero outbound requests when you format.',
      },
      {
        q: 'What is the maximum file size?',
        a: 'Files up to 500 MB are supported. Files above 5 MB are automatically processed in a Web Worker using a streaming parser, so the UI stays responsive throughout.',
      },
      {
        q: 'Does the formatter work offline?',
        a: 'Yes, once the page has loaded. All formatting logic is bundled with the app. No network access is required to format, validate, or minify JSON.',
      },
      {
        q: 'What is JSON5 and when should I use it?',
        a: 'JSON5 is a superset of JSON that allows trailing commas, single-quoted strings, and comments. It is commonly used in config files (like Babel or ESLint configs). Enable JSON5 mode when standard JSON.parse() rejects your input.',
      },
      {
        q: 'How does JSONPath querying work?',
        a: 'Enter a JSONPath expression (e.g. $.store.book[*].author) in the query field and the formatter extracts matching values in real time. Useful for exploring large nested payloads without writing code.',
      },
      {
        q: 'Can I format minified JSON?',
        a: 'Yes. Paste any minified JSON string and the formatter will pretty-print it instantly with your chosen indentation. The minify button does the reverse.',
      },
    ],
  });
}

export default function JsonFormatter() {
  const fmt = useJsonFormatter();
  const { indentWithTabs, setIndentWithTabs } = useSettingsStore();
  const fileParser = useFileParser();
  const [showDiff, setShowDiff] = useState(false);
  const [showMarkdown, setShowMarkdown] = useState(false);
  const [showTree, setShowTree] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  usePreloadedInput(fmt.setInput);

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
  }, [fmt.input, fmt.mode, fmt.relaxed, fmt.sortKeys, indentWithTabs]);

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

  // Parse the output (or input) as a JS value for the tree view
  const treeData = useMemo(() => {
    const source = fmt.output || fmt.input;
    if (!source.trim()) return undefined;
    try {
      return JSON.parse(source) as unknown;
    } catch {
      return undefined;
    }
  }, [fmt.output, fmt.input]);

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
        setShowTree(false);
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
        setShowTree(false);
      },
    },
    {
      label: 'Toggle tree view',
      display: '⌘ T',
      key: 't',
      meta: true,
      handler: () => {
        setShowTree((v) => !v);
        setShowDiff(false);
        setShowMarkdown(false);
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
      display: '⌘ ⇧ K',
      key: 'k',
      meta: true,
      shift: true,
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

  const commands = useMemo<Command[]>(
    () => [
      {
        id: 'action:format',
        label: 'Format JSON',
        group: 'Actions',
        shortcut: '⌘ ↵',
        keywords: ['pretty', 'beautify'],
        handler: fmt.process,
      },
      {
        id: 'action:minify',
        label: 'Minify JSON',
        group: 'Actions',
        keywords: ['compress', 'compact'],
        handler: () => {
          fmt.setMode('minify');
          fmt.process();
        },
      },
      {
        id: 'action:validate',
        label: 'Validate JSON',
        group: 'Actions',
        handler: () => {
          fmt.setMode('validate');
          fmt.process();
        },
      },
      {
        id: 'action:clear',
        label: 'Clear input',
        group: 'Actions',
        shortcut: '⌘ ⇧ K',
        handler: fmt.clear,
      },
      {
        id: 'action:toggle-diff',
        label: 'Toggle diff panel',
        group: 'Actions',
        handler: () => {
          setShowDiff((v) => !v);
          setShowMarkdown(false);
        },
      },
      {
        id: 'action:toggle-tree',
        label: 'Toggle tree view',
        group: 'Actions',
        shortcut: '⌘ T',
        handler: () => {
          setShowTree((v) => !v);
          setShowDiff(false);
          setShowMarkdown(false);
        },
      },
      {
        id: 'action:toggle-jsonpath',
        label: 'Toggle JSONPath',
        group: 'Actions',
        handler: () => {
          fmt.setQueryMode(!fmt.isQueryMode);
        },
      },
    ],
    [fmt, setShowDiff, setShowMarkdown, setShowTree]
  );
  useRegisterCommands(commands);

  const pii = usePiiMasking(fmt.output);

  const hasError = fmt.error !== null;
  const isValid = fmt.validationResult === null && fmt.input.trim().length > 0;

  return (
    <>
      <div className="flex flex-col">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-edge bg-surface px-4 py-2">
          <h1 className="text-sm font-semibold text-label-indigo">JSON Formatter</h1>

          <div className="h-4 w-px bg-surface-elevated" aria-hidden="true" />

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
            <TabsContent value="format" className="hidden" />
            <TabsContent value="minify" className="hidden" />
            <TabsContent value="validate" className="hidden" />
          </Tabs>

          <div className="h-4 w-px bg-surface-elevated" aria-hidden="true" />

          {/* Options */}
          <label className="flex cursor-pointer items-center gap-1.5 text-xs text-fg-secondary">
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
          <label className="flex cursor-pointer items-center gap-1.5 text-xs text-fg-secondary">
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

          <div className="h-4 w-px bg-surface-elevated" aria-hidden="true" />

          {/* Indent character toggle */}
          <div className="flex items-center rounded-md border border-edge bg-surface-raised p-0.5">
            <button
              type="button"
              onClick={() => {
                setIndentWithTabs(false);
              }}
              className={cn(
                'rounded px-2 py-0.5 text-xs transition-colors',
                !indentWithTabs ? 'bg-surface-elevated text-fg' : 'text-fg-secondary hover:text-fg'
              )}
            >
              Spaces
            </button>
            <button
              type="button"
              onClick={() => {
                setIndentWithTabs(true);
              }}
              className={cn(
                'rounded px-2 py-0.5 text-xs transition-colors',
                indentWithTabs ? 'bg-surface-elevated text-fg' : 'text-fg-secondary hover:text-fg'
              )}
            >
              Tabs
            </button>
          </div>

          <div className="flex-1" />

          {/* Diff toggle */}
          <button
            type="button"
            className={cn(
              'rounded px-2 py-1 text-xs transition-colors',
              showDiff
                ? 'bg-accent-700/40 text-accent-300'
                : 'text-fg-secondary hover:bg-surface-elevated hover:text-fg'
            )}
            onClick={() => {
              setShowDiff((v) => !v);
              setShowMarkdown(false);
              setShowTree(false);
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
                : 'text-fg-secondary hover:bg-surface-elevated hover:text-fg'
            )}
            onClick={() => {
              setShowMarkdown((v) => !v);
              setShowDiff(false);
              setShowTree(false);
            }}
            aria-pressed={showMarkdown}
            title="Toggle Markdown preview (⌘M)"
          >
            Markdown
          </button>

          {/* Tree view toggle */}
          <button
            type="button"
            className={cn(
              'rounded px-2 py-1 text-xs transition-colors',
              showTree
                ? 'bg-accent-700/40 text-accent-300'
                : 'text-fg-secondary hover:bg-surface-elevated hover:text-fg'
            )}
            onClick={() => {
              setShowTree((v) => !v);
              setShowDiff(false);
              setShowMarkdown(false);
            }}
            aria-pressed={showTree}
            title="Toggle tree view (⌘T)"
          >
            Tree
          </button>

          {/* Validation badge */}
          {fmt.input.trim() && (
            <Badge
              variant={isValid ? 'success' : hasError ? 'destructive' : 'secondary'}
              dot={isValid || hasError}
            >
              {isValid ? 'valid' : hasError ? 'invalid' : '—'}
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
            <kbd className="ml-1 rounded bg-surface-elevated px-1 text-[10px] text-fg-secondary">
              ⌘↵
            </kbd>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-3 text-xs text-fg-secondary"
            onClick={fmt.clear}
            disabled={!fmt.input.trim()}
          >
            Clear
          </Button>

          {/* Shortcuts help */}
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

        {/* Bracket repair notice */}
        {fmt.repairedBrackets && (
          <div
            role="status"
            className="flex items-center gap-2 border-b border-yellow-900/40 bg-yellow-950/30 px-4 py-1.5 text-xs text-yellow-400"
          >
            <span>⚠ Missing closing brackets/braces were automatically appended.</span>
          </div>
        )}

        {/* JSONPath bar */}
        {fmt.isQueryMode && (
          <div className="flex items-center gap-2 border-b border-edge bg-surface-raised/50 px-4 py-2">
            <label htmlFor="jsonpath-input" className="shrink-0 text-xs text-fg-secondary">
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
              className="flex-1 rounded border border-edge-emphasis bg-surface-raised px-2 py-1 font-mono text-xs text-fg placeholder:text-fg-secondary focus:border-accent-500 focus:outline-none"
              placeholder="$.store.book[*].title"
            />
            <Button size="sm" variant="outline" className="h-7 px-3 text-xs" onClick={fmt.runQuery}>
              Run
            </Button>
          </div>
        )}

        {/* Main area: split pane OR diff panel OR markdown preview */}
        <div className="h-[calc(100vh-260px)] min-h-[480px]">
          {showDiff ? (
            <DiffPanel original={fmt.input} modified={fmt.output} className="h-full" />
          ) : (
            <SplitPane
              leftLabel="JSON input editor"
              rightLabel={
                showTree ? 'Tree view' : showMarkdown ? 'Markdown preview' : 'Formatted output'
              }
              className="h-full"
            >
              {/* Left: input */}
              <div className="flex h-full min-h-0 flex-col">
                <div className="flex items-center justify-between border-b border-edge px-3 py-1">
                  <span className="text-[11px] font-medium uppercase tracking-wide text-label-cyan">
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
                        'rounded px-1.5 py-0.5 text-[11px] transition-colors hover:bg-surface-elevated',
                        fmt.isQueryMode ? 'text-accent-400' : 'text-fg-secondary hover:text-fg'
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
                  height="100%"
                />
              </div>

              {/* Right: output, markdown preview, or tree view */}
              {showTree && treeData !== undefined ? (
                <TreeView data={treeData} className="h-full" />
              ) : showMarkdown ? (
                <MarkdownPreview source={fmt.output || fmt.input} className="h-full" />
              ) : (
                <div className="flex h-full min-h-0 flex-col">
                  <div className="flex items-center justify-between border-b border-edge px-3 py-1">
                    <span className="text-[11px] font-medium uppercase tracking-wide text-label-cyan">
                      Output
                    </span>
                    <div className="flex items-center gap-1">
                      <PiiMaskToggle pii={pii} />
                      <PaneActions content={pii.displayContent} downloadFilename="output.json" />
                    </div>
                  </div>
                  <CodeEditor
                    value={pii.displayContent}
                    language="json"
                    label="Formatted JSON output"
                    readOnly
                    placeholder="Formatted output will appear here…"
                    className="flex-1 rounded-none border-0"
                    height="100%"
                  />
                </div>
              )}
            </SplitPane>
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
      <ToolPageContent
        toolName="JSON formatter"
        why={
          <div className="space-y-3 text-fg-secondary">
            <p>
              Most online JSON formatters send your data to a remote server for processing. That
              means your API responses, config files, and internal data structures leave your
              machine — even if the site claims to delete them immediately.
            </p>
            <p>
              formatvault formats and validates JSON entirely inside your browser using the native
              JavaScript engine. Your data never touches a network request. This matters most when
              working with JWTs, database exports, environment configs, or anything that could
              contain credentials or PII.
            </p>
          </div>
        }
        howItWorks={
          <div className="space-y-3 text-fg-secondary">
            <p>
              When you paste or upload JSON, the formatter runs{' '}
              <code className="rounded px-1 py-0.5 font-mono text-[0.85em] text-label-cyan bg-label-cyan/8">
                JSON.parse()
              </code>{' '}
              directly in the browser tab — the same engine your application uses. For relaxed
              syntax (trailing commas, comments), it switches to the{' '}
              <code className="rounded px-1 py-0.5 font-mono text-[0.85em] text-label-cyan bg-label-cyan/8">
                json5
              </code>{' '}
              library. Files larger than 5 MB are streamed through a Web Worker so the UI stays
              responsive.
            </p>
            <p>
              Output is re-serialized with{' '}
              <code className="rounded px-1 py-0.5 font-mono text-[0.85em] text-label-cyan bg-label-cyan/8">
                JSON.stringify()
              </code>{' '}
              using your chosen indentation (2 spaces, 4 spaces, or tabs). All processing happens
              locally — closing the tab discards everything immediately.
            </p>
          </div>
        }
        useCases={[
          'Formatting API responses from Postman, curl, or browser DevTools',
          'Validating JSON config files before deployment (package.json, tsconfig.json, .eslintrc)',
          'Debugging minified JSON payloads from third-party services',
          'Sorting keys alphabetically to make diffs easier to read',
          'Comparing two JSON blobs side-by-side with the built-in diff view',
          'Querying nested data with JSONPath without writing code',
          'Formatting large database exports (up to 500 MB) via streaming',
          'Reviewing JSON that contains credentials or PII without uploading it',
        ]}
        faq={[
          {
            q: 'Is my JSON data safe?',
            a: 'Yes. All processing happens in your browser tab. No data is sent to any server, logged, or stored anywhere. You can verify this by opening DevTools → Network and observing zero outbound requests when you format.',
          },
          {
            q: 'What is the maximum file size?',
            a: 'Files up to 500 MB are supported. Files above 5 MB are automatically processed in a Web Worker using a streaming parser, so the UI stays responsive throughout.',
          },
          {
            q: 'Does the formatter work offline?',
            a: 'Yes, once the page has loaded. All formatting logic is bundled with the app. No network access is required to format, validate, or minify JSON.',
          },
          {
            q: 'What is JSON5 and when should I use it?',
            a: 'JSON5 is a superset of JSON that allows trailing commas, single-quoted strings, and comments. It is commonly used in config files (like Babel or ESLint configs). Enable JSON5 mode when standard JSON.parse() rejects your input.',
          },
          {
            q: 'How does JSONPath querying work?',
            a: 'Enter a JSONPath expression (e.g. $.store.book[*].author) in the query field and the formatter extracts matching values in real time. Useful for exploring large nested payloads without writing code.',
          },
          {
            q: 'Can I format minified JSON?',
            a: 'Yes. Paste any minified JSON string and the formatter will pretty-print it instantly with your chosen indentation. The minify button does the reverse.',
          },
        ]}
      />
    </>
  );
}
