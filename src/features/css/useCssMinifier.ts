import { useState, useCallback } from 'react';
import {
  minifyCss,
  isCssMinifyError,
  type CssMinifyError,
  type CssMinifyResult,
} from './cssMinifier';
import { useLatestWorkerRequest } from '@/hooks/useLatestWorkerRequest';
import type { MinifyStats } from '@/lib/byteSize';
import type { CssMinifyPayload } from '@/workers/cssMinifier.worker';

export interface CssMinifierState {
  input: string;
  output: string;
  error: CssMinifyError | null;
  stats: MinifyStats | null;
  isMinifying: boolean;
}

export interface CssMinifierActions {
  setInput: (v: string) => void;
  process: () => void;
  clear: () => void;
}

export function useCssMinifier(): CssMinifierState & CssMinifierActions {
  const [input, setInputRaw] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<CssMinifyError | null>(null);
  const [stats, setStats] = useState<MinifyStats | null>(null);
  const [isMinifying, setIsMinifying] = useState(false);

  const applyResult = useCallback((result: CssMinifyResult) => {
    setIsMinifying(false);
    if (isCssMinifyError(result)) {
      setError(result);
      setOutput('');
      setStats(null);
    } else {
      setError(null);
      setOutput(result.output);
      setStats(result.stats);
    }
  }, []);

  const { start, cancel } = useLatestWorkerRequest<CssMinifyPayload, CssMinifyResult>({
    createWorker: () =>
      new Worker(new URL('../../workers/cssMinifier.worker.ts', import.meta.url), {
        type: 'module',
      }),
    runInline: ({ input: text }) => minifyCss(text),
    onResult: applyResult,
    failureResult: {
      output: null,
      error: 'CSS minifier failed to load. Please reload the page and try again.',
      line: null,
      column: null,
    },
    name: 'cssMinifier.worker',
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
    start({ input });
  }, [input, start, reset]);

  const setInput = useCallback((v: string) => {
    setInputRaw(v);
    setError(null);
  }, []);

  const clear = useCallback(() => {
    reset();
    setInputRaw('');
  }, [reset]);

  return { input, output, error, stats, isMinifying, setInput, process, clear };
}
