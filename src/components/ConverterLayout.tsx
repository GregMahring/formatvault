import { useState, useEffect, useCallback } from 'react';
import { SplitPane } from '@/components/SplitPane';
import { CodeEditor, type EditorLanguage } from '@/components/CodeEditor';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { ConversionResult, ConvertResult, ConvertError } from '@/features/convert/converters';

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
}

/**
 * Shared layout for all 6 converter pages.
 * Handles input/output state, auto-conversion on input change, error display.
 */
export function ConverterLayout({
  title,
  fromLanguage,
  toLanguage,
  fromPlaceholder,
  toPlaceholder,
  convert,
  toolbarSlot,
}: ConverterLayoutProps) {
  const [input, setInputRaw] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

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

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        runConvert(input);
      }
    },
    [input, runConvert]
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

  const hasError = error !== null;

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div className="flex h-full flex-col" onKeyDown={handleKeyDown}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-800 bg-gray-950 px-4 py-2">
        <h1 className="text-sm font-semibold text-gray-200">{title}</h1>

        {toolbarSlot && (
          <>
            <div className="h-4 w-px bg-gray-800" aria-hidden="true" />
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
          <kbd className="ml-1 rounded bg-gray-800 px-1 text-[10px] text-gray-500">⌘↵</kbd>
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-3 text-xs text-gray-500"
          onClick={clear}
          disabled={!input.trim()}
        >
          Clear
        </Button>
      </div>

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
      <div className="flex min-h-0 flex-1">
        <SplitPane
          leftLabel={`${fromLanguage.toUpperCase()} input editor`}
          rightLabel={`${toLanguage.toUpperCase()} output`}
          className="flex-1"
        >
          {/* Left: input */}
          <div className="flex h-full flex-col">
            <div className="flex items-center border-b border-gray-800 px-3 py-1">
              <span className="text-[11px] font-medium uppercase tracking-wide text-gray-600">
                {fromLanguage.toUpperCase()} Input
              </span>
            </div>
            <CodeEditor
              value={input}
              onChange={setInput}
              language={fromLanguage}
              label={`${fromLanguage.toUpperCase()} input`}
              placeholder={fromPlaceholder ?? `Paste or type ${fromLanguage.toUpperCase()} here…`}
              className="flex-1 rounded-none border-0"
              minHeight="100%"
            />
          </div>

          {/* Right: output */}
          <div className="flex h-full flex-col">
            <div className="flex items-center border-b border-gray-800 px-3 py-1">
              <span className="text-[11px] font-medium uppercase tracking-wide text-gray-600">
                {toLanguage.toUpperCase()} Output
              </span>
            </div>
            <CodeEditor
              value={output}
              language={toLanguage}
              label={`${toLanguage.toUpperCase()} output`}
              readOnly
              placeholder={toPlaceholder ?? `${toLanguage.toUpperCase()} output will appear here…`}
              className="flex-1 rounded-none border-0"
              minHeight="100%"
            />
          </div>
        </SplitPane>
      </div>
    </div>
  );
}
