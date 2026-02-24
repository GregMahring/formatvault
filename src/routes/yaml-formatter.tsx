import { useEffect, useCallback, useState } from 'react';
import type { Route } from './+types/yaml-formatter';
import { SplitPane } from '@/components/SplitPane';
import { CodeEditor } from '@/components/CodeEditor';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileUploadZone } from '@/components/FileUploadZone';
import { PaneActions } from '@/components/PaneActions';
import { DiffPanel } from '@/components/DiffPanel';
import { MarkdownPreview } from '@/components/MarkdownPreview';
import { KeyboardShortcutsModal } from '@/components/KeyboardShortcutsModal';
import { ProgressBar } from '@/components/ProgressBar';
import { useYamlFormatter } from '@/features/yaml/useYamlFormatter';
import { useFileParser } from '@/hooks/useFileParser';
import { useKeyboardShortcuts, type Shortcut } from '@/hooks/useKeyboardShortcuts';
import type { YamlIndent } from '@/features/yaml/yamlFormatter';
import { cn } from '@/lib/utils';
import { Keyboard } from 'lucide-react';

export function meta(_args: Route.MetaArgs) {
  return [
    { title: 'YAML Formatter & Validator — formatvault' },
    {
      name: 'description',
      content:
        'Free online YAML formatter and validator. Format and validate YAML with line-level error reporting. Supports multi-document YAML. 100% client-side.',
    },
    { property: 'og:title', content: 'YAML Formatter & Validator — formatvault' },
    {
      property: 'og:description',
      content:
        'Format and validate YAML online with line-level error reporting. No data leaves your browser.',
    },
  ];
}

export default function YamlFormatter() {
  const fmt = useYamlFormatter();
  const fileParser = useFileParser();
  const [showDiff, setShowDiff] = useState(false);
  const [showMarkdown, setShowMarkdown] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

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
  }, [fmt.input, fmt.indent]);

  // Load parsed file into formatter
  useEffect(() => {
    if (fileParser.result?.output) {
      fmt.setInput(fileParser.result.output);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileParser.result]);

  const handleFileUpload = useCallback(
    (file: File) => {
      fileParser.parseFile(file, 'yaml');
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
      display: '⌘ K',
      key: 'k',
      meta: true,
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

  const hasError = fmt.error !== null;
  const isValid = !hasError && fmt.input.trim().length > 0;

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-800 bg-gray-950 px-4 py-2">
        <h1 className="text-sm font-semibold text-gray-200">YAML Formatter</h1>

        <div className="h-4 w-px bg-gray-800" aria-hidden="true" />

        <label htmlFor="yaml-indent-select" className="text-xs text-gray-400">
          Indent
        </label>
        <select
          id="yaml-indent-select"
          value={fmt.indent}
          onChange={(e) => {
            fmt.setIndent(Number(e.target.value) as YamlIndent);
          }}
          className="rounded border border-gray-700 bg-gray-900 px-2 py-1 text-xs text-gray-200 focus:border-accent-500 focus:outline-none"
        >
          <option value={2}>2 spaces</option>
          <option value={4}>4 spaces</option>
        </select>

        <div className="flex-1" />

        {fmt.documentCount > 1 && (
          <Badge variant="secondary" className="text-xs">
            {String(fmt.documentCount)} documents
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

        {fmt.input.trim() && (
          <Badge variant={isValid ? 'default' : 'destructive'} className="text-xs">
            {isValid ? '✓ Valid' : '✗ Invalid'}
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
          <kbd className="ml-1 rounded bg-gray-800 px-1 text-[10px] text-gray-500">⌘↵</kbd>
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-3 text-xs text-gray-500"
          onClick={fmt.clear}
          disabled={!fmt.input.trim()}
        >
          Clear
        </Button>

        <button
          type="button"
          className="rounded p-1 text-gray-600 hover:bg-gray-800 hover:text-gray-400"
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
        {showDiff ? (
          <DiffPanel original={fmt.input} modified={fmt.output} className="flex-1" />
        ) : (
          <SplitPane
            leftLabel="YAML input editor"
            rightLabel={showMarkdown ? 'Markdown preview' : 'Formatted output'}
            className="flex-1"
          >
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-gray-800 px-3 py-1">
                <span className="text-[11px] font-medium uppercase tracking-wide text-gray-600">
                  Input
                </span>
                <FileUploadZone
                  accept=".yaml,.yml,text/yaml"
                  onFile={handleFileUpload}
                  disabled={fileParser.isParsing}
                />
              </div>
              <CodeEditor
                value={fmt.input}
                onChange={fmt.setInput}
                language="yaml"
                label="YAML input"
                placeholder="Paste or type YAML here…"
                className="flex-1 rounded-none border-0"
                minHeight="100%"
              />
            </div>

            {showMarkdown ? (
              <MarkdownPreview source={fmt.output || fmt.input} className="h-full" />
            ) : (
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b border-gray-800 px-3 py-1">
                  <span className="text-[11px] font-medium uppercase tracking-wide text-gray-600">
                    Output
                  </span>
                  <PaneActions content={fmt.output} downloadFilename="output.yaml" />
                </div>
                <CodeEditor
                  value={fmt.output}
                  language="yaml"
                  label="Formatted YAML output"
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
