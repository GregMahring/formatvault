import { useState, useMemo } from 'react';
import type { Route } from './+types/csv-formatter';
import { buildMeta } from '@/lib/meta';
import { Badge } from '@/components/ui/badge';
import { DiffPanel } from '@/components/DiffPanel';
import { MarkdownPreview } from '@/components/MarkdownPreview';
import { FormatterLayout } from '@/components/FormatterLayout';
import { useCsvFormatter } from '@/features/csv/useCsvFormatter';
import { useFileParser } from '@/hooks/useFileParser';
import { useFormatterPage } from '@/hooks/useFormatterPage';
import { type Shortcut } from '@/hooks/useKeyboardShortcuts';
import { type Command } from '@/stores/commandStore';
import type { Delimiter } from '@/features/csv/csvFormatter';
import { ToolPageContent } from '@/components/ToolPageContent';
import { cn } from '@/lib/utils';

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

  const shortcuts: Shortcut[] = [
    { label: 'Format', display: '⌘ ↵', key: 'Enter', meta: true, handler: fmt.process },
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

  const { pii, handleFileUpload } = useFormatterPage({
    fmt,
    fileParser,
    fileType: 'csv',
    shortcuts,
    commands,
    showShortcuts,
    optionsDepsKey: `${fmt.delimiter}|${String(fmt.hasHeader)}`,
  });

  const hasError = fmt.error !== null;

  return (
    <FormatterLayout
      title="CSV Formatter"
      language="csv"
      input={fmt.input}
      onInputChange={fmt.setInput}
      inputAccept=".csv,text/csv"
      onFileUpload={handleFileUpload}
      inputPlaceholder="Paste or type CSV here…"
      pii={pii}
      downloadFilename="output.csv"
      outputPlaceholder="Formatted output will appear here…"
      onFormat={fmt.process}
      onClear={fmt.clear}
      hasInput={!!fmt.input.trim()}
      error={fmt.error ?? null}
      warning={fmt.warning ?? null}
      fileParser={fileParser}
      shortcuts={shortcuts}
      showShortcuts={showShortcuts}
      onOpenShortcuts={() => {
        setShowShortcuts(true);
      }}
      onCloseShortcuts={() => {
        setShowShortcuts(false);
      }}
      toolbarOptionsSlot={
        <>
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
        </>
      }
      toolbarBadgesSlot={
        <>
          {fmt.rowCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {String(fmt.rowCount)} rows × {String(fmt.columnCount)} cols
              {fmt.detectedDelimiter && fmt.delimiter === 'auto'
                ? ` · detected: ${fmt.detectedDelimiter === '\t' ? 'tab' : fmt.detectedDelimiter}`
                : ''}
            </Badge>
          )}
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
        </>
      }
      fullPaneSlot={
        showDiff ? (
          <DiffPanel original={fmt.input} modified={fmt.output} className="h-full" />
        ) : undefined
      }
      rightPaneSlot={
        showMarkdown ? (
          <MarkdownPreview source={fmt.output || fmt.input} className="h-full" />
        ) : undefined
      }
      rightPaneLabel="Markdown preview"
    >
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
    </FormatterLayout>
  );
}
