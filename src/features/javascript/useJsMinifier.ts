import { useState, useCallback } from 'react';
import {
  minifyJs,
  isJsMinifyError,
  DEFAULT_JS_MINIFY_OPTIONS,
  type JsCommentMode,
  type JsMinifyError,
  type JsMinifyOptions,
  type JsMinifyResult,
  type JsMinifyStats,
  type JsSourceType,
} from './jsMinifier';
import { useLatestWorkerRequest } from '@/hooks/useLatestWorkerRequest';
import type { JsMinifyPayload } from '@/workers/jsMinifier.worker';

export interface JsMinifierState extends JsMinifyOptions {
  input: string;
  output: string;
  error: JsMinifyError | null;
  stats: JsMinifyStats | null;
  isMinifying: boolean;
}

export interface JsMinifierActions {
  setInput: (v: string) => void;
  setSourceType: (v: JsSourceType) => void;
  setCompress: (v: boolean) => void;
  setMangle: (v: boolean) => void;
  setComments: (v: JsCommentMode) => void;
  process: () => void;
  clear: () => void;
}

export function useJsMinifier(): JsMinifierState & JsMinifierActions {
  const [input, setInputRaw] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<JsMinifyError | null>(null);
  const [stats, setStats] = useState<JsMinifyStats | null>(null);
  const [isMinifying, setIsMinifying] = useState(false);
  const [sourceType, setSourceType] = useState<JsSourceType>(DEFAULT_JS_MINIFY_OPTIONS.sourceType);
  const [compress, setCompress] = useState(DEFAULT_JS_MINIFY_OPTIONS.compress);
  const [mangle, setMangle] = useState(DEFAULT_JS_MINIFY_OPTIONS.mangle);
  const [comments, setComments] = useState<JsCommentMode>(DEFAULT_JS_MINIFY_OPTIONS.comments);

  const applyResult = useCallback((result: JsMinifyResult) => {
    setIsMinifying(false);
    if (isJsMinifyError(result)) {
      setError(result);
      setOutput('');
      setStats(null);
    } else {
      setError(null);
      setOutput(result.output);
      setStats(result.stats);
    }
  }, []);

  const { start, cancel } = useLatestWorkerRequest<JsMinifyPayload, JsMinifyResult>({
    createWorker: () =>
      new Worker(new URL('../../workers/jsMinifier.worker.ts', import.meta.url), {
        type: 'module',
      }),
    runInline: ({ input: text, options }) => minifyJs(text, options),
    onResult: applyResult,
    failureResult: {
      output: null,
      error: 'Minifier failed to load. Please reload the page and try again.',
      line: null,
      column: null,
    },
    name: 'jsMinifier.worker',
  });

  const reset = useCallback(() => {
    cancel();
    setOutput('');
    setError(null);
    setStats(null);
    setIsMinifying(false);
  }, [cancel]);

  const process = useCallback(() => {
    if (!input.trim()) {
      reset();
      return;
    }
    setIsMinifying(true);
    start({ input, options: { sourceType, compress, mangle, comments } });
  }, [input, sourceType, compress, mangle, comments, start, reset]);

  const setInput = useCallback((v: string) => {
    setInputRaw(v);
    setError(null);
  }, []);

  const clear = useCallback(() => {
    reset();
    setInputRaw('');
  }, [reset]);

  return {
    input,
    output,
    error,
    stats,
    isMinifying,
    sourceType,
    compress,
    mangle,
    comments,
    setInput,
    setSourceType,
    setCompress,
    setMangle,
    setComments,
    process,
    clear,
  };
}
