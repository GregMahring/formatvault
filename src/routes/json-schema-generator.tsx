import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Route } from './+types/json-schema-generator';
import { buildMeta } from '@/lib/meta';
import { SplitPane } from '@/components/SplitPane';
import { CodeEditor } from '@/components/CodeEditor';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PaneActions } from '@/components/PaneActions';
import { PiiMaskToggle } from '@/components/PiiMaskToggle';
import { KeyboardShortcutsModal } from '@/components/KeyboardShortcutsModal';
import { ValidationResults } from '@/components/ValidationResults';
import { useJsonSchema, type SchemaMode } from '@/features/json/useJsonSchema';
import { useKeyboardShortcuts, type Shortcut } from '@/hooks/useKeyboardShortcuts';
import { usePiiMasking } from '@/hooks/usePiiMasking';
import { useRegisterCommands } from '@/hooks/useRegisterCommands';
import { type Command } from '@/stores/commandStore';
import { usePreloadedInput } from '@/hooks/usePreloadedInput';
import { ToolPageContent } from '@/components/ToolPageContent';
import { cn } from '@/lib/utils';
import { Keyboard } from 'lucide-react';

export { RouteErrorBoundary as ErrorBoundary } from '@/components/RouteErrorBoundary';

const FAQ = [
  {
    q: 'Which JSON Schema draft does the generator produce?',
    a: 'Draft-07. It is the most widely supported draft — Ajv, VS Code, and most validation libraries accept it — and the generated schema includes the matching $schema identifier.',
  },
  {
    q: 'How does it decide which fields are required?',
    a: 'Every property present in your sample is marked as required, because a single sample cannot show which fields are optional. Remove optional fields from the required array before using the schema.',
  },
  {
    q: 'Can I validate JSON against a schema I already have?',
    a: 'Yes. Switch to the Validate tab and paste your schema. Validation uses Ajv and reports every error at once, each with the JSON path where it occurred and the rule that failed.',
  },
  {
    q: 'Is it safe to paste real API responses?',
    a: 'Yes. Schema generation and validation both run in your browser. Your JSON and your schema are never sent to a server.',
  },
  {
    q: 'Why is the generated schema stricter or looser than I expected?',
    a: 'The schema is inferred from one example, so it can only describe what that example contains. Treat it as a starting point: add enums, formats, minimum and maximum values, or pattern rules by hand.',
  },
];

export function meta(_args: Route.MetaArgs) {
  return buildMeta({
    title: 'JSON Schema Generator & Validator — No Upload, Private',
    description:
      'Generate JSON Schema from data and validate JSON against schemas privately in your browser — no data uploaded. Supports Draft-07. Instant results, 100% client-side.',
    path: '/json-schema-generator',
    faqItems: FAQ,
  });
}

export default function JsonSchemaGenerator() {
  const schema = useJsonSchema();
  const [showShortcuts, setShowShortcuts] = useState(false);

  usePreloadedInput(schema.setJsonInput);

  // Auto-generate on input change with debounce (generate mode only)
  useEffect(() => {
    if (schema.mode !== 'generate') return;
    if (!schema.jsonInput.trim()) return;
    const timer = setTimeout(() => {
      void schema.generate();
    }, 400);
    return () => {
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schema.jsonInput, schema.mode]);

  const handleAction = useCallback(() => {
    if (schema.mode === 'generate') {
      void schema.generate();
    } else {
      void schema.validate();
    }
  }, [schema]);

  const shortcuts: Shortcut[] = [
    {
      label: schema.mode === 'generate' ? 'Generate schema' : 'Validate',
      display: '⌘ ↵',
      key: 'Enter',
      meta: true,
      handler: handleAction,
    },
    {
      label: 'Switch mode',
      display: '⌘ G',
      key: 'g',
      meta: true,
      handler: () => {
        schema.setMode(schema.mode === 'generate' ? 'validate' : 'generate');
      },
    },
    {
      label: 'Clear input',
      display: '⌘ ⇧ K',
      key: 'k',
      meta: true,
      shift: true,
      handler: schema.clear,
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
        id: 'action:generate',
        label: 'Generate JSON Schema',
        group: 'Actions',
        shortcut: '⌘ ↵',
        keywords: ['schema', 'infer'],
        handler: () => {
          void schema.generate();
        },
      },
      {
        id: 'action:validate',
        label: 'Validate against schema',
        group: 'Actions',
        keywords: ['check', 'verify'],
        handler: () => {
          void schema.validate();
        },
      },
      {
        id: 'action:use-generated',
        label: 'Use generated schema for validation',
        group: 'Actions',
        handler: () => {
          schema.useGeneratedSchema();
          schema.setMode('validate');
        },
      },
      {
        id: 'action:clear',
        label: 'Clear input',
        group: 'Actions',
        shortcut: '⌘ ⇧ K',
        handler: schema.clear,
      },
    ],
    [schema]
  );
  useRegisterCommands(commands);

  const pii = usePiiMasking(schema.mode === 'generate' ? schema.schemaOutput : '');

  const hasError = schema.error !== null;

  return (
    <div className="flex flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-edge bg-surface px-4 py-2">
        <h1 className="text-sm font-semibold text-label-indigo">JSON Schema Generator</h1>

        <div className="h-4 w-px bg-surface-elevated" aria-hidden="true" />

        {/* Mode tabs */}
        <Tabs
          value={schema.mode}
          onValueChange={(v) => {
            schema.setMode(v as SchemaMode);
          }}
        >
          <TabsList className="h-7">
            <TabsTrigger value="generate" className="h-6 px-2 text-xs">
              Generate
            </TabsTrigger>
            <TabsTrigger value="validate" className="h-6 px-2 text-xs">
              Validate
            </TabsTrigger>
          </TabsList>
          {/* Empty panels required for valid aria-controls references on each trigger */}
          <TabsContent value="generate" />
          <TabsContent value="validate" />
        </Tabs>

        <div className="flex-1" />

        {/* Status badges */}
        {schema.isProcessing && (
          <Badge variant="secondary" className="text-xs">
            Processing...
          </Badge>
        )}
        {schema.validationResult && (
          <Badge variant={schema.validationResult.valid ? 'success' : 'destructive'} dot>
            {schema.validationResult.valid ? 'valid' : 'invalid'}
          </Badge>
        )}
        {schema.mode === 'generate' && schema.schemaOutput && !hasError && (
          <Badge variant="success" dot>
            generated
          </Badge>
        )}
        {hasError && (
          <Badge variant="destructive" dot>
            error
          </Badge>
        )}

        <Button
          size="sm"
          variant="outline"
          className="h-7 px-3 text-xs"
          onClick={handleAction}
          disabled={!schema.jsonInput.trim() || schema.isProcessing}
        >
          {schema.mode === 'generate' ? 'Generate' : 'Validate'}
          <kbd className="ml-1 rounded bg-surface-elevated px-1 text-[10px] text-fg-secondary">
            ⌘↵
          </kbd>
        </Button>

        {schema.mode === 'generate' && schema.schemaOutput && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-3 text-xs text-accent-400"
            onClick={() => {
              schema.useGeneratedSchema();
              schema.setMode('validate');
            }}
          >
            Validate with this schema
          </Button>
        )}

        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-3 text-xs text-fg-secondary"
          onClick={schema.clear}
          disabled={!schema.jsonInput.trim()}
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

      {/* Error bar */}
      {hasError && (
        <div
          role="alert"
          className="flex items-start gap-2 border-b border-danger-fg/30 bg-danger-fg/10 px-4 py-2 text-xs text-danger-fg"
        >
          <span className="shrink-0 font-mono font-semibold">Error</span>
          <span className="flex-1">{schema.error}</span>
        </div>
      )}

      {/* Main area */}
      <div className="h-[calc(100vh-260px)] min-h-[480px]">
        <SplitPane
          leftLabel="JSON input editor"
          rightLabel={schema.mode === 'generate' ? 'Generated JSON Schema' : 'JSON Schema editor'}
          className="h-full"
        >
          {/* Left: JSON input */}
          <div className="flex h-full min-h-0 flex-col">
            <div className="flex h-8 shrink-0 items-center justify-between border-b border-edge px-3">
              <span className="text-[11px] font-medium uppercase tracking-wide text-label-cyan">
                JSON Input
              </span>
            </div>
            <CodeEditor
              value={schema.jsonInput}
              onChange={schema.setJsonInput}
              language="json"
              label="JSON input"
              placeholder="Paste JSON here to generate a schema..."
              className="flex-1 rounded-none border-0"
              height="100%"
            />
          </div>

          {/* Right: Schema output/input + validation results */}
          <div className="flex h-full min-h-0 flex-col">
            <div className="flex h-8 shrink-0 items-center justify-between border-b border-edge px-3">
              <span className="text-[11px] font-medium uppercase tracking-wide text-label-cyan">
                {schema.mode === 'generate' ? 'JSON Schema' : 'Schema'}
              </span>
              {schema.mode === 'generate' && (
                <div className="flex items-center gap-1">
                  <PiiMaskToggle pii={pii} />
                  <PaneActions content={pii.displayContent} downloadFilename="schema.json" />
                </div>
              )}
            </div>

            {schema.mode === 'generate' ? (
              /* Generate mode: read-only schema output */
              <CodeEditor
                value={pii.displayContent}
                language="json"
                label="Generated JSON Schema"
                readOnly
                placeholder="JSON Schema will appear here..."
                className="flex-1 rounded-none border-0"
                height="100%"
              />
            ) : (
              /* Validate mode: editable schema + results */
              <>
                <CodeEditor
                  value={schema.schemaInput}
                  onChange={schema.setSchemaInput}
                  language="json"
                  label="JSON Schema for validation"
                  placeholder="Paste or edit a JSON Schema here..."
                  className={cn(
                    'rounded-none border-0',
                    schema.validationResult ? 'flex-1' : 'flex-[2]'
                  )}
                  minHeight="40%"
                />

                {schema.validationResult && (
                  <div className="border-t border-edge p-3">
                    <ValidationResults result={schema.validationResult} />
                  </div>
                )}
              </>
            )}
          </div>
        </SplitPane>
      </div>

      <KeyboardShortcutsModal
        shortcuts={shortcuts}
        isOpen={showShortcuts}
        onClose={() => {
          setShowShortcuts(false);
        }}
      />

      <ToolPageContent
        toolName="JSON Schema generator"
        why={
          <div className="space-y-3 text-fg-secondary">
            <p>
              The fastest way to write a JSON Schema is to start from a real payload — usually an
              API response, a webhook body, or a production config file. Those samples tend to hold
              exactly the data you should not paste into a third-party website: customer records,
              internal IDs, and tokens.
            </p>
            <p>
              formatvault generates and validates schemas entirely in your browser. The sample you
              paste never leaves your device, so you can work from real data instead of hand-editing
              a sanitised copy first.
            </p>
          </div>
        }
        howItWorks={
          <div className="space-y-3 text-fg-secondary">
            <p>
              In Generate mode, your JSON is analysed to infer a Draft-07 schema: objects become{' '}
              <em>properties</em>, arrays become <em>items</em>, and each value&apos;s type is
              recorded. The schema updates as you type.
            </p>
            <p>
              In Validate mode, Ajv — a widely used JavaScript JSON Schema validator — compiles your
              schema and checks your JSON against it, listing every error with its path. Use{' '}
              <strong>Validate with this schema</strong> to move straight from a generated schema to
              testing other payloads against it.
            </p>
          </div>
        }
        useCases={[
          'Bootstrapping a schema for an API contract from an existing response',
          'Validating webhook payloads before writing the handler that consumes them',
          'Adding editor autocompletion and validation for a JSON config file',
          'Checking that test fixtures still match the shape your code expects',
          'Documenting the structure of a third-party API that publishes no schema',
          'Verifying that LLM structured output conforms to the schema you asked for',
        ]}
        faq={FAQ}
      />
    </div>
  );
}
