import { useState, useMemo } from 'react';
import type { Route } from './+types/json-formatter';
import { buildMeta } from '@/lib/meta';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { DiffPanel } from '@/components/DiffPanel';
import { MarkdownPreview } from '@/components/MarkdownPreview';
import { TreeView } from '@/components/TreeView';
import { FormatterLayout } from '@/components/FormatterLayout';
import { useJsonFormatter } from '@/features/json/useJsonFormatter';
import { useSettingsStore } from '@/stores/settingsStore';
import { useFileParser } from '@/hooks/useFileParser';
import { useTreeData } from '@/hooks/useTreeData';
import { useFormatterPage } from '@/hooks/useFormatterPage';
import { type Shortcut } from '@/hooks/useKeyboardShortcuts';
import { type Command } from '@/stores/commandStore';
import { ToolPageContent } from '@/components/ToolPageContent';
import { cn } from '@/lib/utils';

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

  const treeData = useTreeData(fmt.output, fmt.input, JSON.parse);

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

  const { pii, handleFileUpload } = useFormatterPage({
    fmt,
    fileParser,
    fileType: 'json',
    shortcuts,
    commands,
    showShortcuts,
    optionsDepsKey: `${fmt.mode}|${String(fmt.relaxed)}|${String(fmt.sortKeys)}|${String(indentWithTabs)}`,
    skipAutoProcess: fmt.isQueryMode,
    clearInputOnFileError: true,
  });

  const hasError = fmt.error !== null;
  const isValid = fmt.validationResult === null && fmt.input.trim().length > 0;

  const rightPaneLabel = showTree ? 'Tree view' : showMarkdown ? 'Markdown preview' : undefined;

  return (
    <FormatterLayout
      title="JSON Formatter"
      language="json"
      input={fmt.input}
      onInputChange={fmt.setInput}
      inputAccept=".json,application/json,.json5"
      onFileUpload={handleFileUpload}
      inputPlaceholder="Paste or type JSON here…"
      pii={pii}
      downloadFilename="output.json"
      outputPlaceholder="Formatted output will appear here…"
      onFormat={fmt.isQueryMode ? fmt.runQuery : fmt.process}
      onClear={fmt.clear}
      formatLabel={fmt.isQueryMode ? 'Run query' : 'Format'}
      hasInput={!!fmt.input.trim()}
      error={fmt.error?.error ?? null}
      errorLine={fmt.error?.line ?? null}
      errorColumn={fmt.error?.column ?? null}
      fileParser={fileParser}
      shortcuts={shortcuts}
      showShortcuts={showShortcuts}
      onOpenShortcuts={() => {
        setShowShortcuts(true);
      }}
      onCloseShortcuts={() => {
        setShowShortcuts(false);
      }}
      inputActionsSlot={
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
      }
      toolbarOptionsSlot={
        <>
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
        </>
      }
      toolbarBadgesSlot={
        <>
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
          {fmt.input.trim() && (
            <Badge
              variant={isValid ? 'success' : hasError ? 'destructive' : 'secondary'}
              dot={isValid || hasError}
            >
              {isValid ? 'valid' : hasError ? 'invalid' : '—'}
            </Badge>
          )}
        </>
      }
      noticeSlot={
        <>
          {fileParser.result?.error && (
            <div
              role="alert"
              className="flex items-start gap-2 border-b border-red-900/60 bg-red-950/40 px-4 py-2 text-xs text-red-400"
            >
              <span className="shrink-0 font-mono font-semibold">File error</span>
              <span className="flex-1">{fileParser.result.error}</span>
            </div>
          )}
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
          {fmt.repairedBrackets && (
            <div
              role="status"
              className="flex items-center gap-2 border-b border-yellow-900/40 bg-yellow-950/30 px-4 py-1.5 text-xs text-yellow-400"
            >
              <span>⚠ Missing closing brackets/braces were automatically appended.</span>
            </div>
          )}
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
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-3 text-xs"
                onClick={fmt.runQuery}
              >
                Run
              </Button>
            </div>
          )}
        </>
      }
      fullPaneSlot={
        showDiff ? (
          <DiffPanel original={fmt.input} modified={fmt.output} className="h-full" />
        ) : undefined
      }
      rightPaneSlot={
        showTree && treeData !== undefined ? (
          <TreeView data={treeData} className="h-full" />
        ) : showMarkdown ? (
          <MarkdownPreview source={fmt.output || fmt.input} className="h-full" />
        ) : undefined
      }
      rightPaneLabel={rightPaneLabel}
    >
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
    </FormatterLayout>
  );
}
