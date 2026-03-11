import { useEffect, useCallback, useState, useMemo } from 'react';
import type { Route } from './+types/sql-formatter';
import { buildMeta } from '@/lib/meta';
import { SplitPane } from '@/components/SplitPane';
import { CodeEditor } from '@/components/CodeEditor';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileUploadZone } from '@/components/FileUploadZone';
import { PaneActions } from '@/components/PaneActions';
import { PiiMaskToggle } from '@/components/PiiMaskToggle';
import { DiffPanel } from '@/components/DiffPanel';
import { KeyboardShortcutsModal } from '@/components/KeyboardShortcutsModal';
import { ProgressBar } from '@/components/ProgressBar';
import { useSqlFormatter } from '@/features/sql/useSqlFormatter';
import { useEditorStore } from '@/stores/editorStore';
import { useFileParser } from '@/hooks/useFileParser';
import { useKeyboardShortcuts, type Shortcut } from '@/hooks/useKeyboardShortcuts';
import { usePiiMasking } from '@/hooks/usePiiMasking';
import { useRegisterCommands } from '@/hooks/useRegisterCommands';
import { type Command } from '@/stores/commandStore';
import type { SqlDialect, SqlKeywordCase } from '@/features/sql/sqlFormatter';
import { cn } from '@/lib/utils';
import { Keyboard } from 'lucide-react';

export { RouteErrorBoundary as ErrorBoundary } from '@/components/RouteErrorBoundary';

export function meta(_args: Route.MetaArgs) {
  return buildMeta({
    title: 'SQL Formatter & Beautifier',
    description:
      'Free online SQL formatter and beautifier. Format SQL queries with keyword casing, indentation, and dialect support for PostgreSQL, MySQL, T-SQL, SQLite, BigQuery, and Snowflake. 100% client-side.',
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
  }, [fmt.input, fmt.dialect, fmt.tabWidth, fmt.keywordCase, fmt.linesBetweenQueries]);

  // Load parsed file into formatter
  useEffect(() => {
    if (fileParser.result?.output) {
      fmt.setInput(fileParser.result.output);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileParser.result]);

  const handleFileUpload = useCallback(
    (file: File) => {
      fileParser.parseFile(file, 'text');
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
  useRegisterCommands(commands);

  const pii = usePiiMasking(fmt.output);

  const hasError = fmt.error !== null;
  const isValid = !hasError && fmt.input.trim().length > 0;

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-edge bg-surface px-4 py-2">
        <h1 className="text-sm font-semibold text-fg">SQL Formatter</h1>

        <div className="h-4 w-px bg-surface-elevated" aria-hidden="true" />

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

        <div className="flex-1" />

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
          <span className="flex-1">{fmt.error?.error}</span>
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        {showDiff ? (
          <DiffPanel original={fmt.input} modified={fmt.output} className="flex-1" />
        ) : (
          <SplitPane leftLabel="SQL input editor" rightLabel="Formatted output" className="flex-1">
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-edge px-3 py-1">
                <span className="text-[11px] font-medium uppercase tracking-wide text-fg-tertiary">
                  Input
                </span>
                <FileUploadZone
                  accept=".sql,text/plain"
                  onFile={handleFileUpload}
                  disabled={fileParser.isParsing}
                />
              </div>
              <CodeEditor
                value={fmt.input}
                onChange={fmt.setInput}
                language="sql"
                label="SQL input"
                placeholder="Paste or type SQL here…"
                className="flex-1 rounded-none border-0"
                minHeight="100%"
              />
            </div>

            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-edge px-3 py-1">
                <span className="text-[11px] font-medium uppercase tracking-wide text-fg-tertiary">
                  Output
                </span>
                <div className="flex items-center gap-1">
                  <PiiMaskToggle pii={pii} />
                  <PaneActions content={pii.displayContent} downloadFilename="output.sql" />
                </div>
              </div>
              <CodeEditor
                value={pii.displayContent}
                language="sql"
                label="Formatted SQL output"
                readOnly
                placeholder="Formatted output will appear here…"
                className="flex-1 rounded-none border-0"
                minHeight="100%"
              />
            </div>
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
