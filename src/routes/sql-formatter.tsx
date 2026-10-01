import { useState, useMemo } from 'react';
import type { Route } from './+types/sql-formatter';
import { buildMeta } from '@/lib/meta';
import { Badge } from '@/components/ui/badge';
import { DiffPanel } from '@/components/DiffPanel';
import { FormatterLayout } from '@/components/FormatterLayout';
import { ToolbarSelect, type ToolbarSelectOption } from '@/components/ToolbarSelect';
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

const DIALECT_OPTIONS: ToolbarSelectOption<SqlDialect>[] = [
  { value: 'sql', label: 'Generic SQL' },
  { value: 'postgresql', label: 'PostgreSQL' },
  { value: 'mysql', label: 'MySQL / MariaDB' },
  { value: 'transactsql', label: 'T-SQL (SQL Server)' },
  { value: 'sqlite', label: 'SQLite' },
  { value: 'bigquery', label: 'BigQuery' },
  { value: 'snowflake', label: 'Snowflake' },
];

const KEYWORD_CASE_OPTIONS: ToolbarSelectOption<SqlKeywordCase>[] = [
  { value: 'upper', label: 'UPPERCASE' },
  { value: 'lower', label: 'lowercase' },
  { value: 'preserve', label: 'Preserve' },
];

const INDENT_OPTIONS: ToolbarSelectOption<2 | 4>[] = [
  { value: 2, label: '2 spaces' },
  { value: 4, label: '4 spaces' },
];

const LINES_BETWEEN_OPTIONS: ToolbarSelectOption<1 | 2>[] = [
  { value: 1, label: '1 line' },
  { value: 2, label: '2 lines' },
];

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
          <ToolbarSelect
            id="sql-dialect-select"
            label="Dialect"
            value={fmt.dialect}
            options={DIALECT_OPTIONS}
            onChange={fmt.setDialect}
          />
          <ToolbarSelect
            id="sql-keyword-case-select"
            label="Keywords"
            value={fmt.keywordCase}
            options={KEYWORD_CASE_OPTIONS}
            onChange={fmt.setKeywordCase}
          />
          <ToolbarSelect
            id="sql-indent-select"
            label="Indent"
            value={fmt.tabWidth}
            options={INDENT_OPTIONS}
            onChange={fmt.setTabWidth}
          />
          <ToolbarSelect
            id="sql-lines-select"
            label="Between queries"
            value={fmt.linesBetweenQueries}
            options={LINES_BETWEEN_OPTIONS}
            onChange={fmt.setLinesBetweenQueries}
          />
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
