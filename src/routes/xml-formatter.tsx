import { useEffect, useCallback, useState, useMemo } from 'react';
import type { Route } from './+types/xml-formatter';
import { buildMeta } from '@/lib/meta';
import { SplitPane } from '@/components/SplitPane';
import { CodeEditor } from '@/components/CodeEditor';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { FileUploadZone } from '@/components/FileUploadZone';
import { PaneActions } from '@/components/PaneActions';
import { PiiMaskToggle } from '@/components/PiiMaskToggle';
import { DiffPanel } from '@/components/DiffPanel';
import { KeyboardShortcutsModal } from '@/components/KeyboardShortcutsModal';
import { ProgressBar } from '@/components/ProgressBar';
import { useXmlFormatter } from '@/features/xml/useXmlFormatter';
import { type XmlMode } from '@/features/xml/useXmlFormatter';
import { type XmlIndent } from '@/features/xml/xmlFormatter';
import { useEditorStore } from '@/stores/editorStore';
import { useFileParser } from '@/hooks/useFileParser';
import { useKeyboardShortcuts, type Shortcut } from '@/hooks/useKeyboardShortcuts';
import { usePiiMasking } from '@/hooks/usePiiMasking';
import { useRegisterCommands } from '@/hooks/useRegisterCommands';
import { type Command } from '@/stores/commandStore';
import { ToolPageContent } from '@/components/ToolPageContent';
import { cn } from '@/lib/utils';
import { Keyboard } from 'lucide-react';

export { RouteErrorBoundary as ErrorBoundary } from '@/components/RouteErrorBoundary';

export function meta(_args: Route.MetaArgs) {
  return buildMeta({
    title: 'XML Formatter & Validator — No Upload, 100% Private',
    description:
      'Format, validate and minify XML privately in your browser — no data uploaded. Supports pretty-print, minify, well-formedness validation, diff view, and file upload. 100% client-side.',
    path: '/xml-formatter',
    faqItems: [
      {
        q: 'Is it safe to format XML that contains sensitive data?',
        a: 'Yes. All processing happens in your browser using fast-xml-parser — your XML is never sent to any server. You can verify this by opening DevTools → Network and observing zero outbound requests when you format.',
      },
      {
        q: 'What does "validate" check?',
        a: 'The validator checks that your XML is well-formed: proper tag nesting, closed tags, valid attribute syntax, and legal character encoding. It does not validate against an XSD or DTD schema — that would require a schema file.',
      },
      {
        q: 'Does the formatter preserve comments and CDATA sections?',
        a: 'Yes. Comments and CDATA sections are preserved through the parse-and-rebuild cycle. Attributes are also preserved with their original values.',
      },
      {
        q: 'What is the difference between formatting and minifying?',
        a: 'Formatting adds consistent indentation and newlines to make the XML human-readable. Minifying removes all non-significant whitespace to produce the smallest possible output, useful for reducing payload sizes.',
      },
      {
        q: 'Does it work offline?',
        a: 'Yes, once the page has loaded. The fast-xml-parser library is bundled with the app and requires no network access to format or validate XML.',
      },
    ],
  });
}

export default function XmlFormatter() {
  const fmt = useXmlFormatter();
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

  // Auto-process on input/option changes with 400ms debounce
  useEffect(() => {
    if (!fmt.input.trim()) return;
    const timer = setTimeout(() => {
      fmt.process();
    }, 400);
    return () => {
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fmt.input, fmt.mode, fmt.indent]);

  // Load parsed file into formatter
  useEffect(() => {
    if (fileParser.result?.output) {
      fmt.setInput(fileParser.result.output);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileParser.result]);

  const handleFileUpload = useCallback(
    (file: File) => {
      // XML files are passed as raw text; the formatter hook handles parsing
      fileParser.parseFile(file, 'yaml');
    },
    [fileParser]
  );

  const shortcuts: Shortcut[] = [
    {
      label: 'Format / Run',
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
        label: 'Format XML',
        group: 'Actions',
        shortcut: '⌘ ↵',
        handler: fmt.process,
      },
      {
        id: 'action:minify',
        label: 'Minify XML',
        group: 'Actions',
        keywords: ['compress', 'compact'],
        handler: () => {
          fmt.setMode('minify');
          fmt.process();
        },
      },
      {
        id: 'action:validate',
        label: 'Validate XML',
        group: 'Actions',
        handler: () => {
          fmt.setMode('validate');
          fmt.process();
        },
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
        },
      },
    ],
    [fmt, setShowDiff]
  );
  useRegisterCommands(commands);

  const pii = usePiiMasking(fmt.output);

  const hasError = fmt.error !== null;
  const isValid =
    !hasError && fmt.input.trim().length > 0 && (fmt.output.length > 0 || fmt.mode === 'validate');

  return (
    <>
      <div className="flex flex-col">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-edge bg-surface px-4 py-2">
          <h1 className="text-sm font-semibold text-brand-indigo">XML Formatter</h1>

          <div className="h-4 w-px bg-surface-elevated" aria-hidden="true" />

          {/* Mode tabs */}
          <Tabs
            value={fmt.mode}
            onValueChange={(v) => {
              fmt.setMode(v as XmlMode);
            }}
          >
            <TabsList className="h-7">
              <TabsTrigger value="format" className="h-6 px-2 text-xs">
                Format
              </TabsTrigger>
              <TabsTrigger value="minify" className="h-6 px-2 text-xs">
                Minify
              </TabsTrigger>
              <TabsTrigger value="validate" className="h-6 px-2 text-xs">
                Validate
              </TabsTrigger>
            </TabsList>
            <TabsContent value="format" className="hidden" />
            <TabsContent value="minify" className="hidden" />
            <TabsContent value="validate" className="hidden" />
          </Tabs>

          <div className="h-4 w-px bg-surface-elevated" aria-hidden="true" />

          {/* Indent toggle — only relevant in format mode */}
          {fmt.mode === 'format' && (
            <div className="flex items-center rounded-md border border-edge bg-surface-raised p-0.5">
              {([2, 4] as XmlIndent[]).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => {
                    fmt.setIndent(n);
                  }}
                  aria-label={`${String(n)} spaces`}
                  aria-pressed={fmt.indent === n}
                  className={cn(
                    'min-h-6 min-w-[1.75rem] rounded px-2 py-1 text-xs transition-colors',
                    fmt.indent === n
                      ? 'bg-surface-elevated text-fg'
                      : 'text-fg-secondary hover:text-fg'
                  )}
                >
                  {n}
                </button>
              ))}
              <span className="px-1 text-xs text-fg-secondary" aria-hidden="true">
                spaces
              </span>
            </div>
          )}

          <div className="flex-1" />

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
            }}
            aria-pressed={showDiff}
          >
            Diff
          </button>

          {/* Validation badge */}
          {fmt.input.trim() && (
            <Badge
              variant={isValid ? 'success' : hasError ? 'destructive' : 'secondary'}
              dot={isValid || hasError}
            >
              {isValid ? 'valid' : hasError ? 'invalid' : '—'}
            </Badge>
          )}

          <Button
            size="sm"
            variant="outline"
            className="h-7 px-3 text-xs"
            onClick={fmt.process}
            disabled={!fmt.input.trim()}
          >
            {fmt.mode === 'validate' ? 'Validate' : fmt.mode === 'minify' ? 'Minify' : 'Format'}
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

        {/* File parsing progress */}
        {fileParser.showProgress && fileParser.isParsing && (
          <ProgressBar percent={fileParser.progress} label="Parsing file…" />
        )}

        {/* Error bar */}
        {hasError && (
          <div
            role="alert"
            className="flex items-start gap-2 border-b border-red-900/60 bg-red-950/40 px-4 py-2 text-xs text-red-400"
          >
            <span className="shrink-0 font-mono font-semibold">Error</span>
            <span className="flex-1">{fmt.error?.error}</span>
            {fmt.error?.line != null && (
              <span className="ml-auto shrink-0 text-red-500/70">
                Line {String(fmt.error.line)}
                {fmt.error.col != null ? `:${String(fmt.error.col)}` : ''}
              </span>
            )}
          </div>
        )}

        {/* Validate success notice */}
        {fmt.mode === 'validate' && !hasError && fmt.input.trim() && (
          <div
            role="status"
            className="flex items-center gap-2 border-b border-green-900/40 bg-green-950/30 px-4 py-1.5 text-xs text-green-400"
          >
            <span>✓ Well-formed XML</span>
          </div>
        )}

        {/* File parse error */}
        {fileParser.result?.error && (
          <div
            role="alert"
            className="flex items-start gap-2 border-b border-red-900/60 bg-red-950/40 px-4 py-2 text-xs text-red-400"
          >
            <span className="shrink-0 font-mono font-semibold">File error</span>
            <span className="flex-1">{fileParser.result.error}</span>
          </div>
        )}

        {/* Main area */}
        <div className="h-[calc(100vh-260px)] min-h-[480px]">
          {showDiff ? (
            <DiffPanel original={fmt.input} modified={fmt.output} className="h-full" />
          ) : (
            <SplitPane
              leftLabel="XML input editor"
              rightLabel="Formatted output"
              className="h-full"
            >
              {/* Left: input */}
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b border-edge px-3 py-1">
                  <span className="text-[11px] font-medium uppercase tracking-wide text-brand-cyan">
                    Input
                  </span>
                  <FileUploadZone
                    accept=".xml,text/xml,application/xml"
                    onFile={handleFileUpload}
                    disabled={fileParser.isParsing}
                  />
                </div>
                <CodeEditor
                  value={fmt.input}
                  onChange={fmt.setInput}
                  language="xml"
                  label="XML input"
                  placeholder="Paste or type XML here…"
                  className="flex-1 rounded-none border-0"
                  height="100%"
                />
              </div>

              {/* Right: output */}
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b border-edge px-3 py-1">
                  <span className="text-[11px] font-medium uppercase tracking-wide text-brand-cyan">
                    Output
                  </span>
                  <div className="flex items-center gap-1">
                    <PiiMaskToggle pii={pii} />
                    <PaneActions content={pii.displayContent} downloadFilename="output.xml" />
                  </div>
                </div>
                <CodeEditor
                  value={pii.displayContent}
                  language="xml"
                  label="Formatted XML output"
                  readOnly
                  placeholder="Formatted output will appear here…"
                  className="flex-1 rounded-none border-0"
                  height="100%"
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

      <ToolPageContent
        toolName="XML formatter"
        why={
          <div className="space-y-3 text-fg-secondary">
            <p>
              XML is still the wire format for a huge amount of enterprise software — SOAP APIs,
              Maven POM files, Android manifests, SVG, Office Open XML, and countless config
              systems. Pasting these into an online formatter means sending potentially sensitive
              payloads — API responses, credentials in config attributes, internal service addresses
              — to a third-party server.
            </p>
            <p>
              formatvault formats and validates XML entirely inside your browser using{' '}
              <code className="rounded px-1 py-0.5 font-mono text-[0.85em] text-brand-cyan bg-[#00d4e8]/8">
                fast-xml-parser
              </code>
              . Nothing is transmitted. The network tab will show zero outbound requests while you
              work.
            </p>
          </div>
        }
        howItWorks={
          <div className="space-y-3 text-fg-secondary">
            <p>
              Your XML is parsed into an in-memory tree using{' '}
              <code className="rounded px-1 py-0.5 font-mono text-[0.85em] text-brand-cyan bg-[#00d4e8]/8">
                fast-xml-parser
              </code>
              , then re-serialized with consistent indentation. Attributes, CDATA sections, and
              comments are preserved through the round-trip. The{' '}
              <code className="rounded px-1 py-0.5 font-mono text-[0.85em] text-brand-cyan bg-[#00d4e8]/8">
                XMLValidator
              </code>{' '}
              checks well-formedness before formatting so you get a precise error with line and
              column numbers before any output is produced.
            </p>
            <p>
              Minify mode strips all non-significant whitespace for smaller payloads. Validate mode
              checks only well-formedness without modifying the input — useful as a quick sanity
              check before committing a config file.
            </p>
          </div>
        }
        useCases={[
          'Formatting SOAP request/response bodies from API testing tools',
          'Validating Android AndroidManifest.xml and layout files before building',
          'Pretty-printing Maven pom.xml files with deeply nested dependency trees',
          'Debugging minified XML payloads from enterprise integrations (SAP, Salesforce)',
          'Formatting SVG files exported from Figma or Illustrator for readability',
          'Normalising Office Open XML (.docx/.xlsx internals) for inspection',
          'Minifying XML config files before bundling into a deployment artifact',
          'Checking well-formedness of RSS or Atom feed XML',
        ]}
        faq={[
          {
            q: 'Is it safe to format XML that contains sensitive data?',
            a: 'Yes. All processing happens in your browser using fast-xml-parser — your XML is never sent to any server. You can verify this by opening DevTools → Network and observing zero outbound requests when you format.',
          },
          {
            q: 'What does "validate" check?',
            a: 'The validator checks that your XML is well-formed: proper tag nesting, closed tags, valid attribute syntax, and legal character encoding. It does not validate against an XSD or DTD schema — that would require a schema file.',
          },
          {
            q: 'Does the formatter preserve comments and CDATA sections?',
            a: 'Yes. Comments and CDATA sections are preserved through the parse-and-rebuild cycle. Attributes are also preserved with their original values.',
          },
          {
            q: 'What is the difference between formatting and minifying?',
            a: 'Formatting adds consistent indentation and newlines to make the XML human-readable. Minifying removes all non-significant whitespace to produce the smallest possible output, useful for reducing payload sizes.',
          },
          {
            q: 'Does it work offline?',
            a: 'Yes, once the page has loaded. The fast-xml-parser library is bundled with the app and requires no network access to format or validate XML.',
          },
        ]}
      />
    </>
  );
}
