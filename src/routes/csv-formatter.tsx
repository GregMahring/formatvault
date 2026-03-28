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
import { ToolPageContent } from '@/components/ToolPageContent';
import { cn } from '@/lib/utils';
import { Keyboard } from 'lucide-react';

export { RouteErrorBoundary as ErrorBoundary } from '@/components/RouteErrorBoundary';

export function meta(_args: Route.MetaArgs) {
  return buildMeta({
    title: 'CSV Formatter & Validator — No Upload, 100% Private',
    description:
      'Format and validate CSV privately in your browser — no data uploaded. Auto-detects delimiters (comma, tab, pipe, semicolon). Streaming parser handles files up to 500MB.',
    path: '/csv-formatter',
    faqItems: [
      {
        q: 'Is my CSV data safe to format here?',
        a: 'Yes. PapaParse runs entirely in your browser — no row of your file is transmitted to any server. This is safe to use with PII, financial records, or any data you would not normally share with a third party.',
      },
      {
        q: 'What delimiters are supported?',
        a: 'Comma, tab (TSV), pipe (|), and semicolon. The formatter auto-detects the delimiter in your input and you can choose any of these for the output.',
      },
      {
        q: 'What is the maximum file size?',
        a: "Up to 500 MB. Files above 1 MB are parsed in a Web Worker using PapaParse's streaming mode, so the UI stays responsive throughout.",
      },
      {
        q: 'Does it handle CSV files with quoted fields containing commas?',
        a: 'Yes. PapaParse correctly handles RFC 4180 quoting — fields containing the delimiter character, newlines, or quotes are parsed and re-quoted correctly.',
      },
      {
        q: 'Can I validate that my CSV has consistent column counts?',
        a: 'Yes. The validator reports rows where the column count does not match the header, helping you catch truncation or extra-field issues before loading into a database.',
      },
    ],
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
    <>
      <div className="flex flex-col">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-edge bg-surface px-4 py-2">
          <h1 className="text-sm font-semibold text-fg">CSV Formatter</h1>

          <div className="h-4 w-px bg-surface-elevated" aria-hidden="true" />

          <label htmlFor="delimiter-select" className="text-xs text-fg-secondary">
            Delimiter
          </label>
          <select
            id="delimiter-select"
            value={fmt.delimiter}
            onChange={(e) => {
              fmt.setDelimiter(e.target.value as Delimiter);
            }}
            className="rounded border border-edge-emphasis bg-surface-raised px-2 py-1 text-xs text-fg focus:border-accent-500 focus:outline-none"
          >
            {DELIMITERS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>

          <div className="h-4 w-px bg-surface-elevated" aria-hidden="true" />

          <label className="flex cursor-pointer items-center gap-1.5 text-xs text-fg-secondary">
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
                : 'text-fg-tertiary hover:bg-surface-elevated hover:text-fg'
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
                : 'text-fg-tertiary hover:bg-surface-elevated hover:text-fg'
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
            <Badge variant="success" dot>
              valid
            </Badge>
          )}
          {hasError && (
            <Badge variant="destructive" dot>
              invalid
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

          <button
            type="button"
            className="rounded p-1 text-fg-tertiary hover:bg-surface-elevated hover:text-fg-secondary"
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

        <div className="h-[calc(100vh-260px)] min-h-[480px]">
          {showDiff ? (
            <DiffPanel original={fmt.input} modified={fmt.output} className="h-full" />
          ) : (
            <SplitPane
              leftLabel="CSV input editor"
              rightLabel={showMarkdown ? 'Markdown preview' : 'Formatted output'}
              className="h-full"
            >
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b border-edge px-3 py-1">
                  <span className="text-[11px] font-medium uppercase tracking-wide text-fg-tertiary">
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
                  height="100%"
                />
              </div>

              {showMarkdown ? (
                <MarkdownPreview source={fmt.output || fmt.input} className="h-full" />
              ) : (
                <div className="flex h-full flex-col">
                  <div className="flex items-center justify-between border-b border-edge px-3 py-1">
                    <span className="text-[11px] font-medium uppercase tracking-wide text-fg-tertiary">
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
        toolName="CSV formatter"
        why={
          <div className="space-y-3 text-fg-secondary">
            <p>
              CSV files frequently contain personal data — customer lists, order exports, HR
              records, financial transactions. Uploading them to an online formatter means that data
              passes through someone else's infrastructure, even if only briefly.
            </p>
            <p>
              formatvault parses and reformats CSV entirely in your browser using PapaParse, the
              same library trusted by data engineering teams at scale. No row of your data is ever
              transmitted. The file stays on your machine from open to close.
            </p>
          </div>
        }
        howItWorks={
          <div className="space-y-3 text-fg-secondary">
            <p>
              PapaParse sniffs the first few rows to detect the delimiter automatically — comma,
              tab, pipe, or semicolon. It then parses the entire file, detects whether the first row
              is a header, and reformats each row with consistent quoting and your chosen output
              delimiter.
            </p>
            <p>
              Files above 1 MB are processed in a Web Worker so the main thread stays responsive.
              The streaming parser can handle files up to 500 MB without loading the full content
              into memory at once.
            </p>
          </div>
        }
        useCases={[
          'Cleaning up CSV exports from Excel or Google Sheets with inconsistent quoting',
          'Normalising delimiter style before importing into PostgreSQL, MySQL, or BigQuery',
          'Validating that a CSV is well-formed before committing it to a data pipeline',
          'Re-delimiting a pipe-separated file to comma-separated for tool compatibility',
          'Formatting customer export data from Stripe, Shopify, or Salesforce without uploading it',
          'Previewing large CSV files (up to 500 MB) without opening Excel',
          'Detecting encoding issues and inconsistent row lengths before processing',
        ]}
        faq={[
          {
            q: 'Is my CSV data safe to format here?',
            a: 'Yes. PapaParse runs entirely in your browser — no row of your file is transmitted to any server. This is safe to use with PII, financial records, or any data you would not normally share with a third party.',
          },
          {
            q: 'What delimiters are supported?',
            a: 'Comma, tab (TSV), pipe (|), and semicolon. The formatter auto-detects the delimiter in your input and you can choose any of these for the output.',
          },
          {
            q: 'What is the maximum file size?',
            a: "Up to 500 MB. Files above 1 MB are parsed in a Web Worker using PapaParse's streaming mode, so the UI stays responsive throughout.",
          },
          {
            q: 'Does it handle CSV files with quoted fields containing commas?',
            a: 'Yes. PapaParse correctly handles RFC 4180 quoting — fields containing the delimiter character, newlines, or quotes are parsed and re-quoted correctly.',
          },
          {
            q: 'Can I validate that my CSV has consistent column counts?',
            a: 'Yes. The validator reports rows where the column count does not match the header, helping you catch truncation or extra-field issues before loading into a database.',
          },
        ]}
      />
    </>
  );
}
