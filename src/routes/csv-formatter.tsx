import { useEffect, useCallback, useState, useMemo } from 'react';
import type { Route } from './+types/csv-formatter';
import { buildMeta } from '@/lib/meta';
import { SplitPane } from '@/components/SplitPane';
import { CodeEditor } from '@/components/CodeEditor';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileUploadZone } from '@/components/FileUploadZone';
import { PaneActions } from '@/components/PaneActions';
import { PiiMaskToggle } from '@/components/PiiMaskToggle';
import { DiffPanel } from '@/components/DiffPanel';
import { MarkdownPreview } from '@/components/MarkdownPreview';
import { KeyboardShortcutsModal } from '@/components/KeyboardShortcutsModal';
import { ProgressBar } from '@/components/ProgressBar';
import { useCsvFormatter } from '@/features/csv/useCsvFormatter';
import { useEditorStore } from '@/stores/editorStore';
import { useFileParser } from '@/hooks/useFileParser';
import { useKeyboardShortcuts, type Shortcut } from '@/hooks/useKeyboardShortcuts';
import { usePiiMasking } from '@/hooks/usePiiMasking';
import { useRegisterCommands } from '@/hooks/useRegisterCommands';
import { type Command } from '@/stores/commandStore';
import type { Delimiter } from '@/features/csv/csvFormatter';
import { cn } from '@/lib/utils';
import { Keyboard } from 'lucide-react';

export { RouteErrorBoundary as ErrorBoundary } from '@/components/RouteErrorBoundary';

export function meta(_args: Route.MetaArgs) {
  return buildMeta({
    title: 'CSV Formatter & Validator',
    description:
      'Free online CSV formatter and validator. Format and validate CSV with automatic delimiter detection (comma, tab, pipe, semicolon). 100% client-side.',
    path: '/csv-formatter',
  });
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
  const fileParser = useFileParser();
  const [showDiff, setShowDiff] = useState(false);
  const [showMarkdown, setShowMarkdown] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Load pre-loaded input from the landing page paste flow
  useEffect(() => {
    const preloaded = useEditorStore.getState().input;
    if (preloaded) {
      fmt.setInput(preloaded);
      useEditorStore.getState().reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
  }, [fmt.input, fmt.delimiter, fmt.hasHeader]);

  // Load parsed file into formatter
  useEffect(() => {
    if (fileParser.result?.output) {
      fmt.setInput(fileParser.result.output);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileParser.result]);

  const handleFileUpload = useCallback(
    (file: File) => {
      fileParser.parseFile(file, 'csv');
    },
    [fileParser]
  );

  const shortcuts: Shortcut[] = [
    {
      label: 'Format',
      display: '⌘ ↵',
      key: 'Enter',
      meta: true,
      handler: fmt.process,
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
        label: 'Format CSV',
        group: 'Actions',
        shortcut: '⌘ ↵',
        handler: fmt.process,
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
    ],
    [fmt, setShowDiff, setShowMarkdown]
  );
  useRegisterCommands(commands);

  const pii = usePiiMasking(fmt.output);

  const hasError = fmt.error !== null;

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-800 bg-gray-950 px-4 py-2">
        <h1 className="text-sm font-semibold text-gray-200">CSV Formatter</h1>

        <div className="h-4 w-px bg-gray-800" aria-hidden="true" />

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

        {fmt.rowCount > 0 && (
          <Badge variant="secondary" className="text-xs">
            {String(fmt.rowCount)} rows × {String(fmt.columnCount)} cols
            {fmt.detectedDelimiter && fmt.delimiter === 'auto'
              ? ` · detected: ${fmt.detectedDelimiter === '\t' ? 'tab' : fmt.detectedDelimiter}`
              : ''}
          </Badge>
        )}

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
          <kbd className="ml-1 rounded bg-gray-800 px-1 text-[10px] text-gray-400">⌘↵</kbd>
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-3 text-xs text-gray-400"
          onClick={fmt.clear}
          disabled={!fmt.input.trim()}
        >
          Clear
        </Button>

        <button
          type="button"
          className="rounded p-1 text-gray-500 hover:bg-gray-800 hover:text-gray-400"
          onClick={() => {
            setShowShortcuts(true);
          }}
          aria-label="Keyboard shortcuts"
          title="Keyboard shortcuts (?)"
        >
          <Keyboard className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>

      {fileParser.showProgress && fileParser.isParsing && (
        <ProgressBar percent={fileParser.progress} label="Parsing file…" />
      )}

      {hasError && (
        <div
          role="alert"
          className="flex items-start gap-2 border-b border-red-900/60 bg-red-950/40 px-4 py-2 text-xs text-red-400"
        >
          <span className="shrink-0 font-mono font-semibold">Error</span>
          <span className="flex-1">{fmt.error}</span>
        </div>
      )}

      {fmt.warning && !hasError && (
        <div
          role="status"
          className="flex items-start gap-2 border-b border-yellow-900/60 bg-yellow-950/30 px-4 py-2 text-xs text-yellow-400"
        >
          <span className="shrink-0 font-mono font-semibold">Warning</span>
          <span className="flex-1">{fmt.warning}</span>
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        {showDiff ? (
          <DiffPanel original={fmt.input} modified={fmt.output} className="flex-1" />
        ) : (
          <SplitPane
            leftLabel="CSV input editor"
            rightLabel={showMarkdown ? 'Markdown preview' : 'Formatted output'}
            className="flex-1"
          >
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-gray-800 px-3 py-1">
                <span className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                  Input
                </span>
                <FileUploadZone
                  accept=".csv,text/csv"
                  onFile={handleFileUpload}
                  disabled={fileParser.isParsing}
                />
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

            {showMarkdown ? (
              <MarkdownPreview source={fmt.output || fmt.input} className="h-full" />
            ) : (
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b border-gray-800 px-3 py-1">
                  <span className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                    Output
                  </span>
                  <div className="flex items-center gap-1">
                    <PiiMaskToggle pii={pii} />
                    <PaneActions content={pii.displayContent} downloadFilename="output.csv" />
                  </div>
                </div>
                <CodeEditor
                  value={pii.displayContent}
                  language="csv"
                  label="Formatted CSV output"
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
