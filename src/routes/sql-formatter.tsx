import { useState, useMemo } from 'react';
import type { Route } from './+types/sql-formatter';
import { buildMeta } from '@/lib/meta';
import { Badge } from '@/components/ui/badge';
import { DiffPanel } from '@/components/DiffPanel';
import { FormatterLayout } from '@/components/FormatterLayout';
import { useSqlFormatter } from '@/features/sql/useSqlFormatter';
import { useFileParser } from '@/hooks/useFileParser';
import { useFormatterPage } from '@/hooks/useFormatterPage';
import { type Shortcut } from '@/hooks/useKeyboardShortcuts';
import { type Command } from '@/stores/commandStore';
import type { SqlDialect, SqlKeywordCase } from '@/features/sql/sqlFormatter';
import { cn } from '@/lib/utils';

export { RouteErrorBoundary as ErrorBoundary } from '@/components/RouteErrorBoundary';

export function meta(_args: Route.MetaArgs) {
  return buildMeta({
    title: 'SQL Formatter & Beautifier — No Upload, 100% Private',
    description:
      'Format SQL queries privately in your browser — no data uploaded. Supports PostgreSQL, MySQL, T-SQL, SQLite, BigQuery, and Snowflake. Keyword casing, indentation, and dialect-aware formatting.',
    path: '/sql-formatter',
  });
}

const DIALECT_LABELS: Record<SqlDialect, string> = {
  sql: 'Generic SQL',
  postgresql: 'PostgreSQL',
  mysql: 'MySQL / MariaDB',
  transactsql: 'T-SQL (SQL Server)',
  sqlite: 'SQLite',
  bigquery: 'BigQuery',
  snowflake: 'Snowflake',
};

export default function SqlFormatter() {
  const fmt = useSqlFormatter();
  const fileParser = useFileParser();
  const [showDiff, setShowDiff] = useState(false);
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
        label: 'Format SQL',
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
        shortcut: '⌘ D',
        handler: () => {
          setShowDiff((v) => !v);
        },
      },
    ],
    [fmt, setShowDiff]
  );

  const { pii, handleFileUpload } = useFormatterPage({
    fmt,
    fileParser,
    fileType: 'text',
    shortcuts,
    commands,
    showShortcuts,
    optionsDepsKey: `${fmt.dialect}|${String(fmt.tabWidth)}|${fmt.keywordCase}|${String(fmt.linesBetweenQueries)}`,
  });

  const hasError = fmt.error !== null;
  const isValid = !hasError && fmt.input.trim().length > 0;

  return (
    <FormatterLayout
      title="SQL Formatter"
      language="sql"
      input={fmt.input}
      onInputChange={fmt.setInput}
      inputAccept=".sql,text/plain"
      onFileUpload={handleFileUpload}
      inputPlaceholder="Paste or type SQL here…"
      pii={pii}
      downloadFilename="output.sql"
      outputPlaceholder="Formatted output will appear here…"
      onFormat={fmt.process}
      onClear={fmt.clear}
      hasInput={!!fmt.input.trim()}
      error={fmt.error?.error ?? null}
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
          <label htmlFor="sql-dialect-select" className="text-xs text-fg-secondary">
            Dialect
          </label>
          <select
            id="sql-dialect-select"
            value={fmt.dialect}
            onChange={(e) => {
              fmt.setDialect(e.target.value as SqlDialect);
            }}
            className="rounded border border-edge-emphasis bg-surface-raised px-2 py-1 text-xs text-fg focus:border-accent-500 focus:outline-none"
          >
            {(Object.entries(DIALECT_LABELS) as [SqlDialect, string][]).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          <label htmlFor="sql-keyword-case-select" className="text-xs text-fg-secondary">
            Keywords
          </label>
          <select
            id="sql-keyword-case-select"
            value={fmt.keywordCase}
            onChange={(e) => {
              fmt.setKeywordCase(e.target.value as SqlKeywordCase);
            }}
            className="rounded border border-edge-emphasis bg-surface-raised px-2 py-1 text-xs text-fg focus:border-accent-500 focus:outline-none"
          >
            <option value="upper">UPPERCASE</option>
            <option value="lower">lowercase</option>
            <option value="preserve">Preserve</option>
          </select>

          <label htmlFor="sql-indent-select" className="text-xs text-fg-secondary">
            Indent
          </label>
          <select
            id="sql-indent-select"
            value={fmt.tabWidth}
            onChange={(e) => {
              fmt.setTabWidth(Number(e.target.value) as 2 | 4);
            }}
            className="rounded border border-edge-emphasis bg-surface-raised px-2 py-1 text-xs text-fg focus:border-accent-500 focus:outline-none"
          >
            <option value={2}>2 spaces</option>
            <option value={4}>4 spaces</option>
          </select>

          <label htmlFor="sql-lines-select" className="text-xs text-fg-secondary">
            Between queries
          </label>
          <select
            id="sql-lines-select"
            value={fmt.linesBetweenQueries}
            onChange={(e) => {
              fmt.setLinesBetweenQueries(Number(e.target.value) as 1 | 2);
            }}
            className="rounded border border-edge-emphasis bg-surface-raised px-2 py-1 text-xs text-fg focus:border-accent-500 focus:outline-none"
          >
            <option value={1}>1 line</option>
            <option value={2}>2 lines</option>
          </select>
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
            }}
            aria-pressed={showDiff}
            title="Toggle diff (⌘D)"
          >
            Diff
          </button>
          {fmt.input.trim() && (
            <Badge variant={isValid ? 'success' : 'destructive'} dot>
              {isValid ? 'valid' : 'invalid'}
            </Badge>
          )}
        </>
      }
      fullPaneSlot={
        showDiff ? (
          <DiffPanel original={fmt.input} modified={fmt.output} className="h-full" />
        ) : undefined
      }
    />
  );
}
