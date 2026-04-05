import { useState, useEffect, useCallback, useMemo } from 'react';
import { SplitPane } from '@/components/SplitPane';
import { CodeEditor, type EditorLanguage } from '@/components/CodeEditor';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileUploadZone } from '@/components/FileUploadZone';
import { PaneActions } from '@/components/PaneActions';
import { PiiMaskToggle } from '@/components/PiiMaskToggle';
import { KeyboardShortcutsModal } from '@/components/KeyboardShortcutsModal';
import { ProgressBar } from '@/components/ProgressBar';
import { useFileParser } from '@/hooks/useFileParser';
import { useKeyboardShortcuts, type Shortcut } from '@/hooks/useKeyboardShortcuts';
import { usePiiMasking } from '@/hooks/usePiiMasking';
import { useRegisterCommands } from '@/hooks/useRegisterCommands';
import { type Command } from '@/stores/commandStore';
import type { ConversionResult, ConvertResult, ConvertError } from '@/features/convert/converters';
import { useEditorStore } from '@/stores/editorStore';
import { Keyboard } from 'lucide-react';

function isConvertError(r: ConversionResult): r is ConvertError {
  return r.error !== null;
}
function isConvertResult(r: ConversionResult): r is ConvertResult {
  return r.error === null;
}

export interface ConverterLayoutProps {
  title: string;
  fromLanguage: EditorLanguage;
  toLanguage: EditorLanguage;
  fromPlaceholder?: string;
  toPlaceholder?: string;
  /** The conversion function to run */
  convert: (input: string) => ConversionResult;
  /** Extra toolbar controls (e.g. delimiter selector for CSV outputs) */
  toolbarSlot?: React.ReactNode;
  /** Content rendered below the tool (SEO sections, FAQ, etc.) */
  children?: React.ReactNode;
}

/**
 * Shared layout for all 6 converter pages.
 * Handles input/output state, auto-conversion on input change, error display,
 * file upload, copy/download, and keyboard shortcuts.
 */
export function ConverterLayout({
  title,
  fromLanguage,
  toLanguage,
  fromPlaceholder,
  toPlaceholder,
  convert,
  toolbarSlot,
  children,
}: ConverterLayoutProps) {
  const [input, setInputRaw] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const fileParser = useFileParser();

  const runConvert = useCallback(
    (value: string) => {
      if (!value.trim()) {
        setOutput('');
        setError(null);
        setWarning(null);
        return;
      }
      const result = convert(value);
      if (isConvertError(result)) {
        setError(result.error);
        setOutput('');
        setWarning(null);
      } else if (isConvertResult(result)) {
        setError(null);
        setOutput(result.output);
        setWarning(result.warning ?? null);
      }
    },
    [convert]
  );

  // Auto-convert on input change with 400ms debounce
  useEffect(() => {
    if (!input.trim()) {
      setOutput('');
      setError(null);
      setWarning(null);
      return;
    }
    const timer = setTimeout(() => {
      runConvert(input);
    }, 400);
    return () => {
      clearTimeout(timer);
    };
  }, [input, runConvert]);

  // Load pre-populated input from the home page paste flow
  useEffect(() => {
    const preloaded = useEditorStore.getState().input;
    if (preloaded) {
      setInputRaw(preloaded);
      useEditorStore.getState().reset();
    }
  }, []);

  // Load parsed file into input
  useEffect(() => {
    if (fileParser.result?.output) {
      setInputRaw(fileParser.result.output);
      setError(null);
    }
  }, [fileParser.result]);

  const handleFileUpload = useCallback(
    (file: File) => {
      fileParser.parseFile(
        file,
        fromLanguage === 'json' ? 'json' : fromLanguage === 'yaml' ? 'yaml' : 'text'
        // xml and csv use 'text' which returns raw content for the converter hook to handle
      );
    },
    [fileParser, fromLanguage]
  );

  const setInput = useCallback((v: string) => {
    setInputRaw(v);
    setError(null);
  }, []);

  const clear = useCallback(() => {
    setInputRaw('');
    setOutput('');
    setError(null);
    setWarning(null);
  }, []);

  const shortcuts: Shortcut[] = [
    {
      label: 'Convert',
      display: '⌘ ↵',
      key: 'Enter',
      meta: true,
      handler: () => {
        runConvert(input);
      },
    },
    {
      label: 'Clear input',
      display: '⌘ ⇧ K',
      key: 'k',
      meta: true,
      shift: true,
      handler: clear,
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
        id: 'action:convert',
        label: 'Convert',
        group: 'Actions',
        shortcut: '⌘ ↵',
        handler: () => {
          runConvert(input);
        },
      },
      {
        id: 'action:clear',
        label: 'Clear input',
        group: 'Actions',
        shortcut: '⌘ ⇧ K',
        handler: clear,
      },
    ],
    [runConvert, input, clear]
  );
  useRegisterCommands(commands);

  const pii = usePiiMasking(output);

  const hasError = error !== null;

  return (
    <>
      <div className="flex flex-col">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-edge bg-surface px-4 py-2">
          <h1 className="text-sm font-semibold text-label-indigo">{title}</h1>

          {toolbarSlot && (
            <>
              <div className="h-4 w-px bg-surface-elevated" aria-hidden="true" />
              {toolbarSlot}
            </>
          )}

          <div className="flex-1" />

          {input.trim() && !hasError && (
            <Badge variant="default" className="text-xs">
              ✓ Converted
            </Badge>
          )}
          {hasError && (
            <Badge variant="destructive" className="text-xs">
              ✗ Error
            </Badge>
          )}

          <Button
            size="sm"
            variant="outline"
            className="h-7 px-3 text-xs"
            onClick={() => {
              runConvert(input);
            }}
            disabled={!input.trim()}
          >
            Convert
            <kbd className="ml-1 rounded bg-surface-elevated px-1 text-[10px] text-fg-secondary">
              ⌘↵
            </kbd>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-3 text-xs text-fg-secondary"
            onClick={clear}
            disabled={!input.trim()}
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

        {/* Error bar */}
        {hasError && (
          <div
            role="alert"
            className="flex items-start gap-2 border-b border-red-900/60 bg-red-950/40 px-4 py-2 text-xs text-red-400"
          >
            <span className="shrink-0 font-mono font-semibold">Error</span>
            <span className="flex-1">{error}</span>
          </div>
        )}

        {/* Warning bar (lossy conversion notice) */}
        {warning && !hasError && (
          <div
            role="status"
            className="flex items-start gap-2 border-b border-yellow-900/60 bg-yellow-950/30 px-4 py-2 text-xs text-yellow-400"
          >
            <span className="shrink-0 font-mono font-semibold">Note</span>
            <span className="flex-1">{warning}</span>
          </div>
        )}

        {/* Split pane */}
        <div className="h-[calc(100vh-260px)] min-h-[480px]">
          <SplitPane
            leftLabel={`${fromLanguage.toUpperCase()} input editor`}
            rightLabel={`${toLanguage.toUpperCase()} output`}
            className="h-full"
          >
            {/* Left: input */}
            <div className="flex h-full min-h-0 flex-col">
              <div className="flex items-center justify-between border-b border-edge px-3 py-1">
                <span className="text-[11px] font-medium uppercase tracking-wide text-label-cyan">
                  {fromLanguage.toUpperCase()} Input
                </span>
                <FileUploadZone
                  accept={
                    fromLanguage === 'json'
                      ? '.json,application/json'
                      : fromLanguage === 'yaml'
                        ? '.yaml,.yml,text/yaml'
                        : fromLanguage === 'xml'
                          ? '.xml,text/xml,application/xml'
                          : '.csv,text/csv'
                  }
                  onFile={handleFileUpload}
                  disabled={fileParser.isParsing}
                />
              </div>
              <CodeEditor
                value={input}
                onChange={setInput}
                language={fromLanguage}
                label={`${fromLanguage.toUpperCase()} input`}
                placeholder={fromPlaceholder ?? `Paste or type ${fromLanguage.toUpperCase()} here…`}
                className="flex-1 rounded-none border-0"
                height="100%"
              />
            </div>

            {/* Right: output */}
            <div className="flex h-full min-h-0 flex-col">
              <div className="flex items-center justify-between border-b border-edge px-3 py-1">
                <span className="text-[11px] font-medium uppercase tracking-wide text-label-cyan">
                  {toLanguage.toUpperCase()} Output
                </span>
                <div className="flex items-center gap-1">
                  <PiiMaskToggle pii={pii} />
                  <PaneActions
                    content={pii.displayContent}
                    downloadFilename={`output.${toLanguage === 'json' ? 'json' : toLanguage === 'yaml' ? 'yaml' : toLanguage === 'typescript' ? 'ts' : toLanguage === 'xml' ? 'xml' : 'csv'}`}
                  />
                </div>
              </div>
              <CodeEditor
                value={pii.displayContent}
                language={toLanguage}
                label={`${toLanguage.toUpperCase()} output`}
                readOnly
                placeholder={
                  toPlaceholder ?? `${toLanguage.toUpperCase()} output will appear here…`
                }
                className="flex-1 rounded-none border-0"
                height="100%"
              />
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
      {children}
    </>
  );
}
