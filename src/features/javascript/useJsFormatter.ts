import { useState, useCallback, useEffect, useRef } from 'react';
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
import type { JsFormatRequest, JsFormatResponse } from '@/workers/jsFormatter.worker';

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

  const workerRef = useRef<Worker | null>(null);
  // Formatting is async; only the most recent request may update state, so a
  // slow run on old input can't overwrite the result for newer input.
  const latestIdRef = useRef(0);

  useEffect(
    () => () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    },
    []
  );

  const applyResult = useCallback((id: number, result: JsResult) => {
    if (id !== latestIdRef.current) return;
    setIsFormatting(false);
    if (isJsError(result)) {
      setError(result);
      setOutput('');
    } else {
      setError(null);
      setOutput(result.output);
    }
  }, []);

  const runFormat = useCallback(
    (id: number, text: string, options: JsFormatOptions) => {
      // jsdom (tests) and very old browsers lack Worker; format inline there.
      if (typeof Worker === 'undefined') {
        void formatJs(text, options).then((result) => {
          applyResult(id, result);
        });
        return;
      }

      if (!workerRef.current) {
        const worker = new Worker(new URL('../../workers/jsFormatter.worker.ts', import.meta.url), {
          type: 'module',
        });
        worker.onmessage = (e: MessageEvent<JsFormatResponse>) => {
          applyResult(e.data.id, e.data.result);
        };
        worker.onerror = (e) => {
          console.error('[jsFormatter.worker] worker failed', e.message);
          workerRef.current?.terminate();
          workerRef.current = null;
          applyResult(latestIdRef.current, {
            output: null,
            error: 'Formatter failed to load. Please reload the page and try again.',
            line: null,
            column: null,
          });
        };
        workerRef.current = worker;
      }
      workerRef.current.postMessage({ id, input: text, options } satisfies JsFormatRequest);
    },
    [applyResult]
  );

  const process = useCallback(() => {
    const id = ++latestIdRef.current;
    if (!input.trim()) {
      setOutput('');
      setError(null);
      setIsFormatting(false);
      return;
    }
    setIsFormatting(true);
    runFormat(id, input, { parser, indent, printWidth, singleQuote, semi, trailingComma });
  }, [input, parser, indent, printWidth, singleQuote, semi, trailingComma, runFormat]);

  const setInput = useCallback((v: string) => {
    setInputRaw(v);
    setError(null);
  }, []);

  const clear = useCallback(() => {
    latestIdRef.current++;
    setInputRaw('');
    setOutput('');
    setError(null);
    setIsFormatting(false);
  }, []);

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
