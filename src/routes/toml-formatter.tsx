import { useState, useMemo } from 'react';
import type { Route } from './+types/toml-formatter';
import { buildMeta } from '@/lib/meta';
import { Badge } from '@/components/ui/badge';
import { TreeView } from '@/components/TreeView';
import { FormatterLayout } from '@/components/FormatterLayout';
import { useTomlFormatter } from '@/features/toml/useTomlFormatter';
import { parseToml } from '@/features/toml/tomlFormatter';
import { useFileParser } from '@/hooks/useFileParser';
import { useTreeData } from '@/hooks/useTreeData';
import { useFormatterPage } from '@/hooks/useFormatterPage';
import { type Shortcut } from '@/hooks/useKeyboardShortcuts';
import { type Command } from '@/stores/commandStore';
import { cn } from '@/lib/utils';

export { RouteErrorBoundary as ErrorBoundary } from '@/components/RouteErrorBoundary';

export function meta(_args: Route.MetaArgs) {
  return buildMeta({
    title: 'TOML Formatter & Validator — No Upload, 100% Private',
    description:
      'Format and validate TOML config files privately in your browser — no data uploaded. Line-level error reporting. Supports Cargo.toml, pyproject.toml, and all standard TOML.',
    path: '/toml-formatter',
  });
}

function parseTomlForTree(source: string): unknown {
  const result = parseToml(source);
  return result.error === null ? result.value : undefined;
}

export default function TomlFormatter() {
  const fmt = useTomlFormatter();
  const fileParser = useFileParser();
  const [showTree, setShowTree] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const treeData = useTreeData(fmt.output, fmt.input, parseTomlForTree);

  const shortcuts: Shortcut[] = [
    { label: 'Format', display: '⌘ ↵', key: 'Enter', meta: true, handler: fmt.process },
    {
      label: 'Toggle tree view',
      display: '⌘ T',
      key: 't',
      meta: true,
      handler: () => {
        setShowTree((v) => !v);
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
        label: 'Format TOML',
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
        id: 'action:toggle-tree',
        label: 'Toggle tree view',
        group: 'Actions',
        shortcut: '⌘ T',
        handler: () => {
          setShowTree((v) => !v);
        },
      },
    ],
    [fmt, setShowTree]
  );

  const { pii, handleFileUpload } = useFormatterPage({
    fmt,
    fileParser,
    fileType: 'text',
    shortcuts,
    commands,
    showShortcuts,
  });

  const hasError = fmt.error !== null;
  const isValid = !hasError && fmt.input.trim().length > 0;

  return (
    <FormatterLayout
      title="TOML Formatter"
      language="toml"
      input={fmt.input}
      onInputChange={fmt.setInput}
      inputAccept=".toml,text/plain"
      onFileUpload={handleFileUpload}
      inputPlaceholder="Paste or type TOML here…"
      pii={pii}
      downloadFilename="output.toml"
      outputPlaceholder="Formatted output will appear here…"
      onFormat={fmt.process}
      onClear={fmt.clear}
      hasInput={!!fmt.input.trim()}
      error={fmt.error?.error ?? null}
      errorLine={fmt.error?.line ?? null}
      fileParser={fileParser}
      shortcuts={shortcuts}
      showShortcuts={showShortcuts}
      onOpenShortcuts={() => {
        setShowShortcuts(true);
      }}
      onCloseShortcuts={() => {
        setShowShortcuts(false);
      }}
      toolbarBadgesSlot={
        <>
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
            }}
            aria-pressed={showTree}
            title="Toggle tree view (⌘T)"
          >
            Tree
          </button>
          {fmt.input.trim() && (
            <Badge variant={isValid ? 'success' : 'destructive'} dot>
              {isValid ? 'valid' : 'invalid'}
            </Badge>
          )}
        </>
      }
      rightPaneSlot={
        showTree && treeData !== undefined ? (
          <TreeView data={treeData} className="h-full" />
        ) : undefined
      }
      rightPaneLabel="Tree view"
    />
  );
}
