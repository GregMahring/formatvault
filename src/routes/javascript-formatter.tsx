import { useState, useMemo, useCallback } from 'react';
import type { Route } from './+types/javascript-formatter';
import { buildMeta } from '@/lib/meta';
import { Badge } from '@/components/ui/badge';
import { DiffPanel } from '@/components/DiffPanel';
import { FormatterLayout } from '@/components/FormatterLayout';
import { ToolPageContent } from '@/components/ToolPageContent';
import { useJsFormatter } from '@/features/javascript/useJsFormatter';
import type {
  JsIndent,
  JsParser,
  JsPrintWidth,
  JsTrailingComma,
} from '@/features/javascript/jsFormatter';
import { useFileParser } from '@/hooks/useFileParser';
import { useFormatterPage } from '@/hooks/useFormatterPage';
import { type Shortcut } from '@/hooks/useKeyboardShortcuts';
import { type Command } from '@/stores/commandStore';
import { cn } from '@/lib/utils';

export { RouteErrorBoundary as ErrorBoundary } from '@/components/RouteErrorBoundary';

const FAQ = [
  {
    q: 'Is my code uploaded anywhere?',
    a: 'No. Prettier runs in a Web Worker inside your browser. Your source code is never sent to a server, logged, or stored — closing the tab discards it.',
  },
  {
    q: 'Does it run my JavaScript?',
    a: 'No. The code is parsed into a syntax tree and printed back out. It is never evaluated, so formatting untrusted or malicious code is safe.',
  },
  {
    q: 'Does it support JSX, TypeScript, and TSX?',
    a: 'Yes. The JavaScript parser handles modern ECMAScript and JSX. Switch the parser to TypeScript for type annotations, interfaces, enums, generics, and TSX. Uploading a .ts or .tsx file selects the TypeScript parser automatically.',
  },
  {
    q: 'Will the output match Prettier in my project?',
    a: 'It uses the same Prettier engine. If you set the indent, quotes, semicolons, trailing commas, and line width to match your .prettierrc, the output will be the same as running Prettier locally.',
  },
  {
    q: 'Why does it say my code is invalid?',
    a: 'Prettier must parse the code before it can format it, so any syntax error stops formatting. The error bar shows the line and column. A common cause is TypeScript syntax (type annotations, interfaces) with the JavaScript parser selected.',
  },
  {
    q: 'Can I un-minify or beautify minified JavaScript?',
    a: 'Yes. Paste minified code and it is re-indented and wrapped into readable form. Variable names shortened by a minifier cannot be restored, but the structure becomes easy to follow.',
  },
];

export function meta(_args: Route.MetaArgs) {
  return buildMeta({
    title: 'JavaScript Formatter & Beautifier — No Upload, 100% Private',
    description:
      'Format and beautify JavaScript, JSX, and TypeScript privately in your browser with Prettier — no code uploaded. Configure indent, quotes, semicolons, trailing commas, and line width.',
    path: '/javascript-formatter',
    faqItems: FAQ,
  });
}

const SELECT_CLASS =
  'rounded border border-edge-emphasis bg-surface-raised px-2 py-1 text-xs text-fg focus:border-accent-500 focus:outline-none';

const TS_FILE = /\.(c|m)?tsx?$/i;

function Code({ children }: { children: string }) {
  return (
    <code className="rounded px-1 py-0.5 font-mono text-[0.85em] text-label-cyan bg-label-cyan/8">
      {children}
    </code>
  );
}

export default function JavaScriptFormatter() {
  const fmt = useJsFormatter();
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
        label: 'Format JavaScript',
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
    optionsDepsKey: [
      fmt.parser,
      String(fmt.indent),
      String(fmt.printWidth),
      String(fmt.singleQuote),
      String(fmt.semi),
      fmt.trailingComma,
    ].join('|'),
  });

  const { setParser } = fmt;
  const handleJsFileUpload = useCallback(
    (file: File) => {
      setParser(TS_FILE.test(file.name) ? 'typescript' : 'babel');
      handleFileUpload(file);
    },
    [setParser, handleFileUpload]
  );

  const hasError = fmt.error !== null;
  const isValid = !hasError && !fmt.isFormatting && fmt.output.length > 0;
  const editorLanguage = fmt.parser === 'typescript' ? 'typescript' : 'javascript';

  return (
    <FormatterLayout
      title="JavaScript Formatter"
      language={editorLanguage}
      input={fmt.input}
      onInputChange={fmt.setInput}
      inputAccept=".js,.mjs,.cjs,.jsx,.ts,.mts,.cts,.tsx,text/javascript,application/javascript"
      onFileUpload={handleJsFileUpload}
      inputPlaceholder="Paste or type JavaScript, JSX, or TypeScript here…"
      pii={pii}
      downloadFilename={fmt.parser === 'typescript' ? 'output.ts' : 'output.js'}
      outputPlaceholder="Formatted output will appear here…"
      onFormat={fmt.process}
      onClear={fmt.clear}
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
          <label htmlFor="js-parser-select" className="text-xs text-fg-secondary">
            Parser
          </label>
          <select
            id="js-parser-select"
            value={fmt.parser}
            onChange={(e) => {
              fmt.setParser(e.target.value as JsParser);
            }}
            className={SELECT_CLASS}
          >
            <option value="babel">JavaScript / JSX</option>
            <option value="typescript">TypeScript / TSX</option>
          </select>

          <label htmlFor="js-indent-select" className="text-xs text-fg-secondary">
            Indent
          </label>
          <select
            id="js-indent-select"
            value={fmt.indent}
            onChange={(e) => {
              const v = e.target.value;
              fmt.setIndent(v === 'tab' ? 'tab' : (Number(v) as JsIndent));
            }}
            className={SELECT_CLASS}
          >
            <option value={2}>2 spaces</option>
            <option value={4}>4 spaces</option>
            <option value="tab">Tabs</option>
          </select>

          <label htmlFor="js-width-select" className="text-xs text-fg-secondary">
            Width
          </label>
          <select
            id="js-width-select"
            value={fmt.printWidth}
            onChange={(e) => {
              fmt.setPrintWidth(Number(e.target.value) as JsPrintWidth);
            }}
            className={SELECT_CLASS}
          >
            <option value={80}>80</option>
            <option value={100}>100</option>
            <option value={120}>120</option>
          </select>

          <label htmlFor="js-quotes-select" className="text-xs text-fg-secondary">
            Quotes
          </label>
          <select
            id="js-quotes-select"
            value={fmt.singleQuote ? 'single' : 'double'}
            onChange={(e) => {
              fmt.setSingleQuote(e.target.value === 'single');
            }}
            className={SELECT_CLASS}
          >
            <option value="double">Double</option>
            <option value="single">Single</option>
          </select>

          <label htmlFor="js-semi-select" className="text-xs text-fg-secondary">
            Semicolons
          </label>
          <select
            id="js-semi-select"
            value={fmt.semi ? 'always' : 'omit'}
            onChange={(e) => {
              fmt.setSemi(e.target.value === 'always');
            }}
            className={SELECT_CLASS}
          >
            <option value="always">Always</option>
            <option value="omit">Omit</option>
          </select>

          <label htmlFor="js-trailing-comma-select" className="text-xs text-fg-secondary">
            Trailing commas
          </label>
          <select
            id="js-trailing-comma-select"
            value={fmt.trailingComma}
            onChange={(e) => {
              fmt.setTrailingComma(e.target.value as JsTrailingComma);
            }}
            className={SELECT_CLASS}
          >
            <option value="all">All</option>
            <option value="es5">ES5</option>
            <option value="none">None</option>
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
          {fmt.input.trim() &&
            (fmt.isFormatting ? (
              <Badge variant="secondary">formatting…</Badge>
            ) : (
              <Badge variant={isValid ? 'success' : 'destructive'} dot>
                {isValid ? 'valid' : 'invalid'}
              </Badge>
            ))}
        </>
      }
      fullPaneSlot={
        showDiff ? (
          <DiffPanel original={fmt.input} modified={fmt.output} className="h-full" />
        ) : undefined
      }
    >
      <ToolPageContent
        toolName="JavaScript formatter"
        why={
          <div className="space-y-3 text-fg-secondary">
            <p>
              Source code is often the most sensitive thing a developer handles — unreleased
              features, internal API endpoints, embedded keys, proprietary business logic. Pasting
              it into an online beautifier that processes it on a server hands a copy to someone
              else.
            </p>
            <p>
              formatvault formats JavaScript and TypeScript with <Code>prettier</Code>, the same
              formatter most JavaScript projects already use, running entirely in your browser. Your
              code never leaves your machine, and the output matches what Prettier produces locally
              with the same settings.
            </p>
          </div>
        }
        howItWorks={
          <div className="space-y-3 text-fg-secondary">
            <p>
              Prettier parses your code into a syntax tree using Babel (for JavaScript and JSX) or
              the TypeScript compiler&apos;s parser (for TypeScript and TSX), then prints it back
              out from scratch using consistent rules. That&apos;s why it can reformat anything from
              a one-line minified bundle to inconsistently indented legacy code. The code is never
              executed.
            </p>
            <p>
              Formatting runs in a Web Worker so large files don&apos;t freeze the page, and the
              parser loads only the first time you format. Syntax errors are reported with the exact
              line and column, and the diff view shows exactly what Prettier changed.
            </p>
          </div>
        }
        useCases={[
          'Beautifying minified JavaScript to read or debug third-party code',
          'Formatting snippets copied from Stack Overflow, docs, or chat before pasting into a codebase',
          'Cleaning up inline scripts, bookmarklets, and tag manager snippets',
          'Checking how Prettier would format code with different settings before committing a .prettierrc',
          'Formatting TypeScript interfaces and types copied from API docs',
          'Normalising JSX from design-tool exports or generated components',
          'Spotting syntax errors quickly with line and column reporting',
        ]}
        faq={FAQ}
      />
    </FormatterLayout>
  );
}
