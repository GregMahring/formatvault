import { useState, useMemo } from 'react';
import type { Route } from './+types/css-minifier';
import { buildMeta } from '@/lib/meta';
import { Badge } from '@/components/ui/badge';
import { DiffPanel } from '@/components/DiffPanel';
import { FormatterLayout } from '@/components/FormatterLayout';
import { MinifyStatsBar } from '@/components/MinifyStatsBar';
import { ToolPageContent } from '@/components/ToolPageContent';
import { useCssMinifier } from '@/features/css/useCssMinifier';
import { useFileParser } from '@/hooks/useFileParser';
import { useFormatterPage } from '@/hooks/useFormatterPage';
import { type Shortcut } from '@/hooks/useKeyboardShortcuts';
import { type Command } from '@/stores/commandStore';
import { cn } from '@/lib/utils';

export { RouteErrorBoundary as ErrorBoundary } from '@/components/RouteErrorBoundary';

const FAQ = [
  {
    q: 'Is my CSS uploaded anywhere?',
    a: 'No. The minifier runs as WebAssembly in a Web Worker inside your browser. Your stylesheet is never sent to a server, logged, or stored — closing the tab discards it.',
  },
  {
    q: 'Does it support CSS nesting and modern syntax?',
    a: 'Yes. Native nesting, custom properties, :has(), :is(), @layer, @container, and modern color syntax are all preserved. Many older online minifiers silently delete nested rules; this one keeps them intact.',
  },
  {
    q: 'What does the minifier change?',
    a: 'It removes whitespace and comments, shortens colors and values (for example #ff0000 becomes red and 0px becomes 0), merges rules with identical declarations, and drops redundant declarations. It does not rewrite your CSS for older browsers.',
  },
  {
    q: 'Are license comments kept?',
    a: 'Yes. Comments starting with /*! are preserved, which is the convention for license and copyright notices. All other comments are removed.',
  },
  {
    q: 'Why is my CSS reported as invalid?',
    a: 'The minifier refuses to guess at broken CSS rather than silently dropping parts of it. The error bar shows the line and column. Common causes are a missing colon or brace, SCSS or Less syntax (variables like $gap, mixins), and old IE hacks such as *zoom.',
  },
  {
    q: 'Can I minify SCSS or Less?',
    a: 'No. Compile SCSS or Less to CSS first, then minify the result.',
  },
];

export function meta(_args: Route.MetaArgs) {
  return buildMeta({
    title: 'CSS Minifier — Minify CSS Privately, No Upload',
    description:
      'Minify CSS privately in your browser — no stylesheet uploaded. Supports native nesting, @layer, @container, and :has(), keeps license comments, and shows minified and gzipped size savings.',
    path: '/css-minifier',
    faqItems: FAQ,
  });
}

function Code({ children }: { children: string }) {
  return (
    <code className="rounded px-1 py-0.5 font-mono text-[0.85em] text-label-cyan bg-label-cyan/8">
      {children}
    </code>
  );
}

export default function CssMinifier() {
  const fmt = useCssMinifier();
  const fileParser = useFileParser();
  const [showDiff, setShowDiff] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const shortcuts: Shortcut[] = [
    { label: 'Minify', display: '⌘ ↵', key: 'Enter', meta: true, handler: fmt.process },
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
        id: 'action:minify',
        label: 'Minify CSS',
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
  });

  const hasError = fmt.error !== null;
  const isValid = !hasError && !fmt.isMinifying && fmt.output.length > 0;

  return (
    <FormatterLayout
      title="CSS Minifier"
      language="css"
      input={fmt.input}
      onInputChange={fmt.setInput}
      inputAccept=".css,text/css"
      onFileUpload={handleFileUpload}
      inputPlaceholder="Paste or type CSS here…"
      pii={pii}
      downloadFilename="output.min.css"
      outputPlaceholder="Minified output will appear here…"
      onFormat={fmt.process}
      onClear={fmt.clear}
      formatLabel="Minify"
      hasInput={!!fmt.input.trim()}
      error={fmt.error?.error ?? null}
      errorLine={fmt.error?.line ?? null}
      errorColumn={fmt.error?.column ?? null}
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
          {fmt.input.trim() &&
            (fmt.isMinifying ? (
              <Badge variant="secondary">minifying…</Badge>
            ) : (
              <Badge variant={isValid ? 'success' : 'destructive'} dot>
                {isValid ? 'valid' : 'invalid'}
              </Badge>
            ))}
        </>
      }
      noticeSlot={fmt.stats && !fmt.isMinifying ? <MinifyStatsBar stats={fmt.stats} /> : undefined}
      fullPaneSlot={
        showDiff ? (
          <DiffPanel original={fmt.input} modified={fmt.output} className="h-full" />
        ) : undefined
      }
    >
      <ToolPageContent
        toolName="CSS minifier"
        why={
          <div className="space-y-3 text-fg-secondary">
            <p>
              Stylesheets often reveal more than they seem to: unreleased product names in class
              names, internal hostnames in asset URLs, and the structure of pages that aren&apos;t
              public yet. Online minifiers that process CSS on a server keep a copy of all of it.
            </p>
            <p>
              formatvault minifies CSS with <Code>lightningcss</Code>, a modern CSS engine compiled
              to WebAssembly, running entirely in your browser. Unlike many older minifiers, it
              understands native CSS nesting, so nested rules come through intact instead of
              silently disappearing.
            </p>
          </div>
        }
        howItWorks={
          <div className="space-y-3 text-fg-secondary">
            <p>
              lightningcss parses your stylesheet into a syntax tree, then removes whitespace and
              comments, shortens colors and lengths, merges rules with identical declarations, and
              prints the result as compactly as possible. Modern syntax is kept exactly as written;
              nothing is rewritten for older browsers. License comments starting with{' '}
              <Code>/*!</Code> are preserved.
            </p>
            <p>
              The engine loads once, the first time you minify, and runs in a Web Worker so the page
              stays responsive. Invalid CSS is reported with its line and column rather than guessed
              at. The size bar compares original, minified, and gzipped sizes, and the diff view
              shows exactly what changed.
            </p>
          </div>
        }
        useCases={[
          'Minifying stylesheets for sites without a build pipeline',
          'Shrinking CSS for HTML email templates and embedded widgets',
          'Compressing styles before pasting them into a CMS or theme editor',
          'Checking how much a stylesheet shrinks when minified and gzipped',
          'Stripping comments from CSS while keeping required license headers',
          'Validating CSS — the minifier pinpoints syntax errors by line and column',
        ]}
        faq={FAQ}
      />
    </FormatterLayout>
  );
}
