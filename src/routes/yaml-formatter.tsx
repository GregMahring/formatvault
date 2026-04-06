import { useState, useMemo } from 'react';
import type { Route } from './+types/yaml-formatter';
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
import { TreeView } from '@/components/TreeView';
import { KeyboardShortcutsModal } from '@/components/KeyboardShortcutsModal';
import { ProgressBar } from '@/components/ProgressBar';
import { useYamlFormatter } from '@/features/yaml/useYamlFormatter';
import { parseYaml } from '@/features/yaml/yamlFormatter';
import { useFileParser } from '@/hooks/useFileParser';
import { useTreeData } from '@/hooks/useTreeData';
import { useFormatterPage } from '@/hooks/useFormatterPage';
import { type Shortcut } from '@/hooks/useKeyboardShortcuts';
import { type Command } from '@/stores/commandStore';
import type { YamlIndent, YamlStyle } from '@/features/yaml/yamlFormatter';
import { ToolPageContent } from '@/components/ToolPageContent';
import { cn } from '@/lib/utils';
import { Keyboard } from 'lucide-react';

export { RouteErrorBoundary as ErrorBoundary } from '@/components/RouteErrorBoundary';

export function meta(_args: Route.MetaArgs) {
  return buildMeta({
    title: 'YAML Formatter & Validator — No Upload, 100% Private',
    description:
      'Format and validate YAML privately in your browser — no data uploaded. Line-level error reporting, multi-document support, diff view, and tree view. 100% client-side.',
    path: '/yaml-formatter',
    faqItems: [
      {
        q: 'Is it safe to format Kubernetes secrets or environment configs here?',
        a: 'Yes. js-yaml runs entirely in your browser — your YAML content is never sent to any server. This is specifically designed for config files that contain sensitive references.',
      },
      {
        q: 'Why does my YAML fail to parse even though it looks correct?',
        a: 'YAML is whitespace-sensitive and has many subtle rules around tabs (not allowed for indentation), implicit types, and multi-line scalars. The error message will show the exact line number — common culprits are tab characters and unquoted strings that look like special types (yes, no, null, ~).',
      },
      {
        q: 'Does it support multi-document YAML?',
        a: 'Yes. Files with multiple documents separated by --- are supported. Each document is parsed and formatted independently.',
      },
      {
        q: 'Can I choose the indentation level?',
        a: 'Yes — 2 spaces, 4 spaces, or tabs. The output style (block vs flow for collections) is also configurable.',
      },
      {
        q: 'Does it work offline?',
        a: 'Yes, once the page has loaded. The js-yaml library is bundled with the app and requires no network access to parse or format YAML.',
      },
    ],
  });
}

function parseYamlForTree(source: string): unknown {
  const result = parseYaml(source);
  return result.error === null ? result.value : undefined;
}

export default function YamlFormatter() {
  const fmt = useYamlFormatter();
  const fileParser = useFileParser();
  const [showDiff, setShowDiff] = useState(false);
  const [showMarkdown, setShowMarkdown] = useState(false);
  const [showTree, setShowTree] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const treeData = useTreeData(fmt.output, fmt.input, parseYamlForTree);

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
        label: 'Format YAML',
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
          setShowTree(false);
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
    ],
    [fmt, setShowDiff, setShowMarkdown, setShowTree]
  );

  const { pii, handleFileUpload } = useFormatterPage({
    fmt,
    fileParser,
    fileType: 'yaml',
    shortcuts,
    commands,
    showShortcuts,
    optionsDepsKey: `${String(fmt.indent)}|${fmt.style}`,
  });

  const hasError = fmt.error !== null;
  const isValid = !hasError && fmt.input.trim().length > 0;

  return (
    <>
      <div className="flex flex-col">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-edge bg-surface px-4 py-2">
          <h1 className="text-sm font-semibold text-label-indigo">YAML Formatter</h1>

          <div className="h-4 w-px bg-surface-elevated" aria-hidden="true" />

          <label htmlFor="yaml-indent-select" className="text-xs text-fg-secondary">
            Indent
          </label>
          <select
            id="yaml-indent-select"
            value={fmt.indent}
            onChange={(e) => {
              fmt.setIndent(Number(e.target.value) as YamlIndent);
            }}
            className="rounded border border-edge-emphasis bg-surface-raised px-2 py-1 text-xs text-fg focus:border-accent-500 focus:outline-none"
          >
            <option value={2}>2 spaces</option>
            <option value={4}>4 spaces</option>
          </select>

          <label htmlFor="yaml-style-select" className="text-xs text-fg-secondary">
            Style
          </label>
          <select
            id="yaml-style-select"
            value={fmt.style}
            onChange={(e) => {
              fmt.setStyle(e.target.value as YamlStyle);
            }}
            className="rounded border border-edge-emphasis bg-surface-raised px-2 py-1 text-xs text-fg focus:border-accent-500 focus:outline-none"
          >
            <option value="block">Block</option>
            <option value="flow">Flow</option>
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

          {/* Markdown preview toggle */}
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

          {/* Tree view toggle */}
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
            className="rounded p-1 text-fg-secondary hover:bg-surface-elevated hover:text-fg"
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
              <span className="ml-auto shrink-0 text-red-500/70">
                Line {String(fmt.error.line)}
              </span>
            )}
          </div>
        )}

        <div className="h-[calc(100vh-260px)] min-h-[480px]">
          {showDiff ? (
            <DiffPanel original={fmt.input} modified={fmt.output} className="h-full" />
          ) : (
            <SplitPane
              leftLabel="YAML input editor"
              rightLabel={
                showTree ? 'Tree view' : showMarkdown ? 'Markdown preview' : 'Formatted output'
              }
              className="h-full"
            >
              <div className="flex h-full min-h-0 flex-col">
                <div className="flex items-center justify-between border-b border-edge px-3 py-1">
                  <span className="text-[11px] font-medium uppercase tracking-wide text-label-cyan">
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
                  height="100%"
                />
              </div>

              {showTree && treeData !== undefined ? (
                <TreeView data={treeData} className="h-full" />
              ) : showMarkdown ? (
                <MarkdownPreview source={fmt.output || fmt.input} className="h-full" />
              ) : (
                <div className="flex h-full min-h-0 flex-col">
                  <div className="flex items-center justify-between border-b border-edge px-3 py-1">
                    <span className="text-[11px] font-medium uppercase tracking-wide text-label-cyan">
                      Output
                    </span>
                    <div className="flex items-center gap-1">
                      <PiiMaskToggle pii={pii} />
                      <PaneActions content={pii.displayContent} downloadFilename="output.yaml" />
                    </div>
                  </div>
                  <CodeEditor
                    value={pii.displayContent}
                    language="yaml"
                    label="Formatted YAML output"
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
        toolName="YAML formatter"
        why={
          <div className="space-y-3 text-fg-secondary">
            <p>
              YAML is the lingua franca of infrastructure configuration — Kubernetes manifests,
              GitHub Actions workflows, Docker Compose files, Ansible playbooks. These files often
              contain environment variable names, internal hostnames, and secret references that
              should not leave your environment.
            </p>
            <p>
              formatvault validates and reformats YAML using{' '}
              <code className="rounded px-1 py-0.5 font-mono text-[0.85em] text-label-cyan bg-label-cyan/8">
                js-yaml
              </code>
              , entirely in your browser. Your config files never touch an external server.
              Line-level error messages pinpoint exactly which line caused the parse failure so you
              can fix it quickly.
            </p>
          </div>
        }
        howItWorks={
          <div className="space-y-3 text-fg-secondary">
            <p>
              js-yaml parses your input into a JavaScript object tree, then re-serializes it with
              consistent indentation and block scalar style. Multi-document YAML (files with{' '}
              <code className="rounded px-1 py-0.5 font-mono text-[0.85em] text-label-cyan bg-label-cyan/8">
                ---
              </code>{' '}
              separators) is handled as separate documents, each formatted independently.
            </p>
            <p>
              The tree view renders the parsed structure as a collapsible node tree, letting you
              navigate deeply nested configs without scrolling. The diff view compares your original
              and formatted output side by side so you can see exactly what changed.
            </p>
          </div>
        }
        useCases={[
          'Validating Kubernetes manifests and Helm chart values before applying to a cluster',
          'Formatting GitHub Actions workflow files with consistent indentation',
          'Debugging Docker Compose files that fail to parse with obscure error messages',
          'Normalising indentation in Ansible playbooks (2 vs 4 spaces)',
          'Inspecting multi-document YAML files (--- separated) from CI/CD pipelines',
          'Comparing two versions of a config file with the built-in diff view',
          'Exploring deeply nested Terraform variable files using the tree view',
        ]}
        faq={[
          {
            q: 'Is it safe to format Kubernetes secrets or environment configs here?',
            a: 'Yes. js-yaml runs entirely in your browser — your YAML content is never sent to any server. This is specifically designed for config files that contain sensitive references.',
          },
          {
            q: 'Why does my YAML fail to parse even though it looks correct?',
            a: 'YAML is whitespace-sensitive and has many subtle rules around tabs (not allowed for indentation), implicit types, and multi-line scalars. The error message will show the exact line number — common culprits are tab characters and unquoted strings that look like special types (e.g. yes, no, null, ~).',
          },
          {
            q: 'Does it support multi-document YAML?',
            a: 'Yes. Files with multiple documents separated by --- are supported. Each document is parsed and formatted independently.',
          },
          {
            q: 'Can I choose the indentation level?',
            a: 'Yes — 2 spaces, 4 spaces, or tabs. The output style (block vs flow for collections) is also configurable.',
          },
          {
            q: 'Does it work offline?',
            a: 'Yes, once the page has loaded. The js-yaml library is bundled with the app and requires no network access to parse or format YAML.',
          },
        ]}
      />
    </>
  );
}
