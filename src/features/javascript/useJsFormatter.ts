import { useState, useCallback } from 'react';
import {
  formatJs,
  isJsError,
  DEFAULT_JS_OPTIONS,
  type JsFormatError,
  type JsFormatOptions,
  type JsIndent,
  type JsParser,
  type JsPrintWidth,
  type JsResult,
  type JsTrailingComma,
} from './jsFormatter';
import { useLatestWorkerRequest } from '@/hooks/useLatestWorkerRequest';
import type { JsFormatPayload } from '@/workers/jsFormatter.worker';

export interface JsFormatterState extends JsFormatOptions {
  input: string;
  output: string;
  error: JsFormatError | null;
  isFormatting: boolean;
}

export interface JsFormatterActions {
  setInput: (v: string) => void;
  setParser: (v: JsParser) => void;
  setIndent: (v: JsIndent) => void;
  setPrintWidth: (v: JsPrintWidth) => void;
  setSingleQuote: (v: boolean) => void;
  setSemi: (v: boolean) => void;
  setTrailingComma: (v: JsTrailingComma) => void;
  process: () => void;
  clear: () => void;
}

export function useJsFormatter(): JsFormatterState & JsFormatterActions {
  const [input, setInputRaw] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<JsFormatError | null>(null);
  const [isFormatting, setIsFormatting] = useState(false);
  const [parser, setParser] = useState<JsParser>(DEFAULT_JS_OPTIONS.parser);
  const [indent, setIndent] = useState<JsIndent>(DEFAULT_JS_OPTIONS.indent);
  const [printWidth, setPrintWidth] = useState<JsPrintWidth>(DEFAULT_JS_OPTIONS.printWidth);
  const [singleQuote, setSingleQuote] = useState(DEFAULT_JS_OPTIONS.singleQuote);
  const [semi, setSemi] = useState(DEFAULT_JS_OPTIONS.semi);
  const [trailingComma, setTrailingComma] = useState<JsTrailingComma>(
    DEFAULT_JS_OPTIONS.trailingComma
  );

  const applyResult = useCallback((result: JsResult) => {
    setIsFormatting(false);
    if (isJsError(result)) {
      setError(result);
      setOutput('');
    } else {
      setError(null);
      setOutput(result.output);
    }
  }, []);

  const { start, cancel } = useLatestWorkerRequest<JsFormatPayload, JsResult>({
    createWorker: () =>
      new Worker(new URL('../../workers/jsFormatter.worker.ts', import.meta.url), {
        type: 'module',
      }),
    runInline: ({ input: text, options }) => formatJs(text, options),
    onResult: applyResult,
    failureResult: {
      output: null,
      error: 'Formatter failed to load. Please reload the page and try again.',
      line: null,
      column: null,
    },
    name: 'jsFormatter.worker',
  });

  const process = useCallback(() => {
    if (!input.trim()) {
      cancel();
      setOutput('');
      setError(null);
      setIsFormatting(false);
      return;
    }
    setIsFormatting(true);
    start({ input, options: { parser, indent, printWidth, singleQuote, semi, trailingComma } });
  }, [input, parser, indent, printWidth, singleQuote, semi, trailingComma, start, cancel]);

  const setInput = useCallback((v: string) => {
    setInputRaw(v);
    setError(null);
  }, []);

  const clear = useCallback(() => {
    cancel();
    setInputRaw('');
    setOutput('');
    setError(null);
    setIsFormatting(false);
  }, [cancel]);

  return {
    input,
    output,
    error,
    isFormatting,
    parser,
    indent,
    printWidth,
    singleQuote,
    semi,
    trailingComma,
    setInput,
    setParser,
    setIndent,
    setPrintWidth,
    setSingleQuote,
    setSemi,
    setTrailingComma,
    process,
    clear,
  };
}
