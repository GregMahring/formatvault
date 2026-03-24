import { useEffect, useCallback, useState, useMemo } from 'react';
import type { Route } from './+types/toml-formatter';
import { buildMeta } from '@/lib/meta';
import { SplitPane } from '@/components/SplitPane';
import { CodeEditor } from '@/components/CodeEditor';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileUploadZone } from '@/components/FileUploadZone';
import { PaneActions } from '@/components/PaneActions';
import { PiiMaskToggle } from '@/components/PiiMaskToggle';
import { TreeView } from '@/components/TreeView';
import { KeyboardShortcutsModal } from '@/components/KeyboardShortcutsModal';
import { ProgressBar } from '@/components/ProgressBar';
import { useTomlFormatter } from '@/features/toml/useTomlFormatter';
import { parseToml } from '@/features/toml/tomlFormatter';
import { useEditorStore } from '@/stores/editorStore';
import { useFileParser } from '@/hooks/useFileParser';
import { useKeyboardShortcuts, type Shortcut } from '@/hooks/useKeyboardShortcuts';
import { usePiiMasking } from '@/hooks/usePiiMasking';
import { useRegisterCommands } from '@/hooks/useRegisterCommands';
import { type Command } from '@/stores/commandStore';
import { cn } from '@/lib/utils';
import { Keyboard } from 'lucide-react';

export { RouteErrorBoundary as ErrorBoundary } from '@/components/RouteErrorBoundary';

export function meta(_args: Route.MetaArgs) {
  return buildMeta({
    title: 'TOML Formatter & Validator — No Upload, 100% Private',
    description:
      'Format and validate TOML config files privately in your browser — no data uploaded. Line-level error reporting. Supports Cargo.toml, pyproject.toml, and all standard TOML.',
    path: '/toml-formatter',
  });
}

export default function TomlFormatter() {
  const fmt = useTomlFormatter();
  const fileParser = useFileParser();
  const [showTree, setShowTree] = useState(false);
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

  // Auto-process on input changes with debounce
  useEffect(() => {
    if (!fmt.input.trim()) return;
    const timer = setTimeout(() => {
      fmt.process();
    }, 400);
    return () => {
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fmt.input]);

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

  // Parse the output (or input) as a JS value for the tree view
  const treeData = useMemo(() => {
    const source = fmt.output || fmt.input;
    if (!source.trim()) return undefined;
    const result = parseToml(source);
    return result.error === null ? result.value : undefined;
  }, [fmt.output, fmt.input]);

  const shortcuts: Shortcut[] = [
    {
      label: 'Format',
      display: '⌘ ↵',
      key: 'Enter',
      meta: true,
      handler: fmt.process,
    },
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

  useKeyboardShortcuts(shortcuts, !showShortcuts);

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
  useRegisterCommands(commands);

  const pii = usePiiMasking(fmt.output);

  const hasError = fmt.error !== null;
  const isValid = !hasError && fmt.input.trim().length > 0;

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-edge bg-surface px-4 py-2">
        <h1 className="text-sm font-semibold text-fg">TOML Formatter</h1>

        <div className="flex-1" />

        {/* Tree view toggle */}
        <button
          type="button"
          className={cn(
            'rounded px-2 py-1 text-xs transition-colors',
            showTree
              ? 'bg-accent-700/40 text-accent-300'
              : 'text-fg-tertiary hover:bg-surface-elevated hover:text-fg'
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
          {fmt.error?.line && (
            <span className="ml-auto shrink-0 text-red-500/70">Line {String(fmt.error.line)}</span>
          )}
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        <SplitPane
          leftLabel="TOML input editor"
          rightLabel={showTree ? 'Tree view' : 'Formatted output'}
          className="flex-1"
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-edge px-3 py-1">
              <span className="text-[11px] font-medium uppercase tracking-wide text-fg-tertiary">
                Input
              </span>
              <FileUploadZone
                accept=".toml,text/plain"
                onFile={handleFileUpload}
                disabled={fileParser.isParsing}
              />
            </div>
            <CodeEditor
              value={fmt.input}
              onChange={fmt.setInput}
              language="toml"
              label="TOML input"
              placeholder="Paste or type TOML here…"
              className="flex-1 rounded-none border-0"
              minHeight="100%"
            />
          </div>

          {showTree && treeData !== undefined ? (
            <TreeView data={treeData} className="h-full" />
          ) : (
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-edge px-3 py-1">
                <span className="text-[11px] font-medium uppercase tracking-wide text-fg-tertiary">
                  Output
                </span>
                <div className="flex items-center gap-1">
                  <PiiMaskToggle pii={pii} />
                  <PaneActions content={pii.displayContent} downloadFilename="output.toml" />
                </div>
              </div>
              <CodeEditor
                value={pii.displayContent}
                language="toml"
                label="Formatted TOML output"
                readOnly
                placeholder="Formatted output will appear here…"
                className="flex-1 rounded-none border-0"
                minHeight="100%"
              />
            </div>
          )}
        </SplitPane>
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
