import { useState, useMemo } from 'react';
import { Link } from 'react-router';
import type { Route } from './+types/javascript-minifier';
import { buildMeta } from '@/lib/meta';
import { formatBytes } from '@/lib/byteSize';
import { Badge } from '@/components/ui/badge';
import { DiffPanel } from '@/components/DiffPanel';
import { FormatterLayout } from '@/components/FormatterLayout';
import { ToolPageContent } from '@/components/ToolPageContent';
import { ToolbarSelect, type ToolbarSelectOption } from '@/components/ToolbarSelect';
import { useJsMinifier } from '@/features/javascript/useJsMinifier';
import type { JsCommentMode, JsMinifyStats, JsSourceType } from '@/features/javascript/jsMinifier';
import { useFileParser } from '@/hooks/useFileParser';
import { useFormatterPage } from '@/hooks/useFormatterPage';
import { type Shortcut } from '@/hooks/useKeyboardShortcuts';
import { type Command } from '@/stores/commandStore';
import { cn } from '@/lib/utils';

export { RouteErrorBoundary as ErrorBoundary } from '@/components/RouteErrorBoundary';

const FAQ = [
  {
    q: 'Is my code uploaded anywhere?',
    a: 'No. terser runs in a Web Worker inside your browser. Your source code is never sent to a server, logged, or stored — closing the tab discards it.',
  },
  {
    q: 'Is the minified code safe to ship?',
    a: 'terser is the minifier used by Vite, webpack, and Rollup for production builds, and its transformations preserve behavior for standard JavaScript. Still, test the output before deploying, especially code that relies on function.name or Function.prototype.toString, which mangling can change.',
  },
  {
    q: 'What is the difference between Module and Script?',
    a: 'Module treats top-level names as private to the file, so unused top-level code is removed and the rest is renamed. Script keeps top-level names unchanged, because other scripts on the same page may use them as globals. Choose Script for classic <script> tags, bookmarklets, and snippets pasted into other pages.',
  },
  {
    q: 'Which comments are kept?',
    a: 'By default, only license comments: those starting with /*! or containing @license or @preserve. You can also remove every comment or keep them all.',
  },
  {
    q: 'Does it support TypeScript or JSX?',
    a: 'No. terser only understands standard JavaScript. Compile TypeScript or JSX to JavaScript first; the JavaScript Formatter on this site can format TypeScript and JSX.',
  },
  {
    q: 'What does the gzipped size mean?',
    a: 'Web servers usually compress JavaScript with gzip or Brotli before sending it. The gzipped figure is roughly what visitors actually download, which is often a fraction of the minified size.',
  },
];

export function meta(_args: Route.MetaArgs) {
  return buildMeta({
    title: 'JavaScript Minifier — Minify JS Privately, No Upload',
    description:
      'Minify JavaScript privately in your browser with terser — no code uploaded. Compress, mangle names, keep license comments, and see the minified and gzipped size savings instantly.',
    path: '/javascript-minifier',
    faqItems: FAQ,
  });
}

const SOURCE_TYPE_OPTIONS: ToolbarSelectOption<JsSourceType>[] = [
  { value: 'module', label: 'Module' },
  { value: 'script', label: 'Script' },
];

const COMMENT_OPTIONS: ToolbarSelectOption<JsCommentMode>[] = [
  { value: 'license', label: 'License only' },
  { value: 'none', label: 'None' },
  { value: 'all', label: 'All' },
];

function percentSaved(from: number, to: number): string {
  if (from === 0) return '0%';
  return `${String(Math.round((1 - to / from) * 100))}%`;
}

function StatsBar({ stats }: { stats: JsMinifyStats }) {
  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-edge bg-surface-raised px-4 py-1.5 text-xs text-fg-secondary"
    >
      <span>
        Original <strong className="font-medium text-fg">{formatBytes(stats.originalBytes)}</strong>
      </span>
      <span>
        Minified <strong className="font-medium text-fg">{formatBytes(stats.minifiedBytes)}</strong>{' '}
        <span className="text-emerald-400">
          −{percentSaved(stats.originalBytes, stats.minifiedBytes)}
        </span>
      </span>
      {/* gzip's fixed ~20-byte overhead makes tiny inputs grow; servers don't
          compress responses that small, so the figure would only mislead. */}
      {stats.gzipBytes !== null && stats.gzipBytes < stats.minifiedBytes && (
        <span>
          Gzipped <strong className="font-medium text-fg">{formatBytes(stats.gzipBytes)}</strong>{' '}
          <span className="text-emerald-400">
            −{percentSaved(stats.originalBytes, stats.gzipBytes)}
          </span>
        </span>
      )}
    </div>
  );
}

function Code({ children }: { children: string }) {
  return (
    <code className="rounded px-1 py-0.5 font-mono text-[0.85em] text-label-cyan bg-label-cyan/8">
      {children}
    </code>
  );
}

export default function JavaScriptMinifier() {
  const fmt = useJsMinifier();
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
        label: 'Minify JavaScript',
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
    optionsDepsKey: [fmt.sourceType, String(fmt.compress), String(fmt.mangle), fmt.comments].join(
      '|'
    ),
  });

  const hasError = fmt.error !== null;
  const isValid = !hasError && !fmt.isMinifying && fmt.output.length > 0;

  return (
    <FormatterLayout
      title="JavaScript Minifier"
      language="javascript"
      input={fmt.input}
      onInputChange={fmt.setInput}
      inputAccept=".js,.mjs,.cjs,text/javascript,application/javascript"
      onFileUpload={handleFileUpload}
      inputPlaceholder="Paste or type JavaScript here…"
      pii={pii}
      downloadFilename="output.min.js"
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
      toolbarOptionsSlot={
        <>
          <ToolbarSelect
            id="js-source-type-select"
            label="Source"
            value={fmt.sourceType}
            options={SOURCE_TYPE_OPTIONS}
            onChange={fmt.setSourceType}
          />
          <ToolbarSelect
            id="js-comments-select"
            label="Comments"
            value={fmt.comments}
            options={COMMENT_OPTIONS}
            onChange={fmt.setComments}
          />
          <label className="flex cursor-pointer items-center gap-1.5 text-xs text-fg-secondary">
            <input
              type="checkbox"
              className="h-3 w-3 accent-accent-500"
              checked={fmt.compress}
              onChange={(e) => {
                fmt.setCompress(e.target.checked);
              }}
            />
            Compress
          </label>
          <label className="flex cursor-pointer items-center gap-1.5 text-xs text-fg-secondary">
            <input
              type="checkbox"
              className="h-3 w-3 accent-accent-500"
              checked={fmt.mangle}
              onChange={(e) => {
                fmt.setMangle(e.target.checked);
              }}
            />
            Mangle names
          </label>
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
      noticeSlot={fmt.stats && !fmt.isMinifying ? <StatsBar stats={fmt.stats} /> : undefined}
      fullPaneSlot={
        showDiff ? (
          <DiffPanel original={fmt.input} modified={fmt.output} className="h-full" />
        ) : undefined
      }
    >
      <ToolPageContent
        toolName="JavaScript minifier"
        why={
          <div className="space-y-3 text-fg-secondary">
            <p>
              The code you minify is usually code you&apos;re about to ship: proprietary logic,
              internal API endpoints, analytics or tag snippets with account IDs. Online minifiers
              that send your code to a server for processing hand a copy to someone else.
            </p>
            <p>
              formatvault minifies JavaScript with <Code>terser</Code>, the same minifier Vite,
              webpack, and Rollup use for production builds, running entirely in your browser. Your
              code never leaves your machine, and you see exactly how much smaller it gets, both
              minified and gzipped.
            </p>
          </div>
        }
        howItWorks={
          <div className="space-y-3 text-fg-secondary">
            <p>
              terser parses your code into a syntax tree, then <strong>compresses</strong> it
              (removing dead code, inlining constants and small functions, simplifying expressions)
              and <strong>mangles</strong> local variable names down to single letters. Finally it
              prints the result with no unnecessary whitespace. The code is never executed.
            </p>
            <p>
              Minification runs in a Web Worker so large files don&apos;t freeze the page. The size
              bar compares the original, minified, and gzipped sizes, and the diff view shows what
              changed. Need to go the other way?{' '}
              <Link to="/javascript-formatter" className="text-label-cyan underline">
                The JavaScript Formatter
              </Link>{' '}
              turns minified code back into readable form.
            </p>
          </div>
        }
        useCases={[
          'Shrinking inline scripts, bookmarklets, and embed snippets without a build pipeline',
          'Minifying tag manager and analytics snippets before pasting them into a CMS',
          'Checking how much a library or file shrinks when minified and gzipped',
          'Preparing small scripts for HTML email, browser extensions, or userscripts',
          'Comparing compress and mangle settings to see what each one saves',
          'Stripping comments from code while keeping required license headers',
        ]}
        faq={FAQ}
      />
    </FormatterLayout>
  );
}
