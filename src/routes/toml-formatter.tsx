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
import { ToolPageContent } from '@/components/ToolPageContent';
import { cn } from '@/lib/utils';

export { RouteErrorBoundary as ErrorBoundary } from '@/components/RouteErrorBoundary';

const FAQ = [
  {
    q: 'Which version of TOML is supported?',
    a: 'TOML v1.0, including inline tables, arrays of tables, multi-line strings, and offset date-times. Files such as Cargo.toml, pyproject.toml, and wrangler.toml all parse as standard TOML.',
  },
  {
    q: 'Are comments preserved when formatting?',
    a: 'No. Formatting parses your TOML into data and writes it back out in a consistent style, and comments are not part of that data. Use the formatter to validate and normalise structure, and keep your original file if its comments matter.',
  },
  {
    q: 'How do I find a syntax error in a large TOML file?',
    a: 'Parse errors report the line number where the parser failed, and the editor highlights that line. Common causes are duplicate keys, a table defined twice, and unquoted strings.',
  },
  {
    q: 'Is it safe to paste config files that contain secrets?',
    a: 'Yes. Parsing and formatting happen in your browser, so your TOML is never sent to a server. That matters for files that hold API tokens, database URLs, or registry credentials.',
  },
  {
    q: 'Does it work offline?',
    a: 'Yes, once the page has loaded. The TOML parser is bundled with the app and needs no network access.',
  },
];

export function meta(_args: Route.MetaArgs) {
  return buildMeta({
    title: 'TOML Formatter & Validator — No Upload, 100% Private',
    description:
      'Format and validate TOML config files privately in your browser — no data uploaded. Line-level error reporting. Supports Cargo.toml, pyproject.toml, and all standard TOML.',
    path: '/toml-formatter',
    faqItems: FAQ,
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
                ? 'bg-accent-700/40 text-accent-fg'
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
    >
      <ToolPageContent
        toolName="TOML formatter"
        why={
          <div className="space-y-3 text-fg-secondary">
            <p>
              TOML is the config format behind Rust&apos;s Cargo, Python&apos;s pyproject.toml,
              Cloudflare&apos;s wrangler.toml, Hugo, and Netlify. Those files often carry registry
              tokens, database URLs, and internal hostnames alongside the settings you are trying to
              debug.
            </p>
            <p>
              formatvault validates and formats TOML entirely in your browser, so you can check a
              config file without sending its contents to anyone else&apos;s server.
            </p>
          </div>
        }
        howItWorks={
          <div className="space-y-3 text-fg-secondary">
            <p>
              Your input is parsed with a spec-compliant TOML v1.0 parser. If parsing fails, the
              error names the line so you can jump straight to it. If it succeeds, the data is
              written back out with consistent spacing, quoting, and table layout.
            </p>
            <p>
              The tree view shows the parsed structure as collapsible nodes, which makes deeply
              nested tables and arrays of tables much easier to follow than the raw file.
            </p>
          </div>
        }
        useCases={[
          'Checking a Cargo.toml or pyproject.toml that a build tool refuses to read',
          'Validating wrangler.toml or netlify.toml before a deploy',
          'Finding duplicate keys or tables that were defined twice',
          'Normalising the formatting of a hand-edited config file',
          'Exploring arrays of tables with the tree view',
        ]}
        faq={FAQ}
      />
    </FormatterLayout>
  );
}
