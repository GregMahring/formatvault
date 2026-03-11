import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Route } from './+types/json-schema-generator';
import { buildMeta } from '@/lib/meta';
import { SplitPane } from '@/components/SplitPane';
import { CodeEditor } from '@/components/CodeEditor';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PaneActions } from '@/components/PaneActions';
import { PiiMaskToggle } from '@/components/PiiMaskToggle';
import { KeyboardShortcutsModal } from '@/components/KeyboardShortcutsModal';
import { ValidationResults } from '@/components/ValidationResults';
import { useJsonSchema, type SchemaMode } from '@/features/json/useJsonSchema';
import { useKeyboardShortcuts, type Shortcut } from '@/hooks/useKeyboardShortcuts';
import { usePiiMasking } from '@/hooks/usePiiMasking';
import { useRegisterCommands } from '@/hooks/useRegisterCommands';
import { type Command } from '@/stores/commandStore';
import { useEditorStore } from '@/stores/editorStore';
import { cn } from '@/lib/utils';
import { Keyboard } from 'lucide-react';

export { RouteErrorBoundary as ErrorBoundary } from '@/components/RouteErrorBoundary';

export function meta(_args: Route.MetaArgs) {
  return buildMeta({
    title: 'JSON Schema Generator & Validator',
    description:
      'Generate JSON Schema from JSON data and validate JSON against schemas online for free. Supports Draft-07. 100% client-side.',
    path: '/json-schema-generator',
  });
}

export default function JsonSchemaGenerator() {
  const schema = useJsonSchema();
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Load pre-loaded input from the landing page paste flow
  useEffect(() => {
    const preloaded = useEditorStore.getState().input;
    if (preloaded) {
      schema.setJsonInput(preloaded);
      useEditorStore.getState().reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-edge bg-surface px-4 py-2">
        <h1 className="text-sm font-semibold text-fg">JSON Schema</h1>

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
          className="h-7 px-3 text-xs text-fg-tertiary"
          onClick={schema.clear}
          disabled={!schema.jsonInput.trim()}
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

      {/* Error bar */}
      {hasError && (
        <div
          role="alert"
          className="flex items-start gap-2 border-b border-red-900/60 bg-red-950/40 px-4 py-2 text-xs text-red-400"
        >
          <span className="shrink-0 font-mono font-semibold">Error</span>
          <span className="flex-1">{schema.error}</span>
        </div>
      )}

      {/* Main area */}
      <div className="flex min-h-0 flex-1">
        <SplitPane
          leftLabel="JSON input editor"
          rightLabel={schema.mode === 'generate' ? 'Generated JSON Schema' : 'JSON Schema editor'}
          className="flex-1"
        >
          {/* Left: JSON input */}
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-edge px-3 py-1">
              <span className="text-[11px] font-medium uppercase tracking-wide text-fg-tertiary">
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
              minHeight="100%"
            />
          </div>

          {/* Right: Schema output/input + validation results */}
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-edge px-3 py-1">
              <span className="text-[11px] font-medium uppercase tracking-wide text-fg-tertiary">
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
                minHeight="100%"
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
    </div>
  );
}
