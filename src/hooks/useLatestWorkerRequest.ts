import { useCallback, useEffect, useRef } from 'react';
import type { WorkerRequest, WorkerResponse } from '@/workers/workerRequest';

export interface UseLatestWorkerRequestOptions<TPayload extends object, TResult> {
  /** Creates the worker on first use. Must use `new Worker(new URL(...))` for Vite to bundle it. */
  createWorker: () => Worker;
  /** Same work on the main thread, for environments without Worker (jsdom, very old browsers). */
  runInline: (payload: TPayload) => Promise<TResult>;
  /** Receives only the result of the most recent `start()` that hasn't been cancelled. */
  onResult: (result: TResult) => void;
  /** Delivered through `onResult` if the worker script fails to load or crashes. */
  failureResult: TResult;
  /** Prefix for the console error logged on worker failure. */
  name: string;
}

export interface UseLatestWorkerRequestResult<TPayload extends object> {
  start: (payload: TPayload) => void;
  /** Ignore any in-flight result, e.g. when the input is cleared. */
  cancel: () => void;
}

/**
 * Runs async work in a lazily created, reused Web Worker where only the latest
 * request wins: a slow run on old input can never overwrite the result for
 * newer input. The worker is terminated on unmount.
 */
export function useLatestWorkerRequest<TPayload extends object, TResult>({
  createWorker,
  runInline,
  onResult,
  failureResult,
  name,
}: UseLatestWorkerRequestOptions<TPayload, TResult>): UseLatestWorkerRequestResult<TPayload> {
  const workerRef = useRef<Worker | null>(null);
  const latestIdRef = useRef(0);
  // Callers pass fresh closures each render; read them through refs so start()
  // stays stable and the worker's message handler never goes stale.
  const optionsRef = useRef({ createWorker, runInline, onResult, failureResult, name });
  optionsRef.current = { createWorker, runInline, onResult, failureResult, name };

  useEffect(
    () => () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    },
    []
  );

  const deliver = useCallback((id: number, result: TResult) => {
    if (id !== latestIdRef.current) return;
    optionsRef.current.onResult(result);
  }, []);

  const start = useCallback(
    (payload: TPayload) => {
      const id = ++latestIdRef.current;

      if (typeof Worker === 'undefined') {
        void optionsRef.current.runInline(payload).then((result) => {
          deliver(id, result);
        });
        return;
      }

      if (!workerRef.current) {
        const worker = optionsRef.current.createWorker();
        worker.onmessage = (e: MessageEvent<WorkerResponse<TResult>>) => {
          deliver(e.data.id, e.data.result);
        };
        worker.onerror = (e) => {
          console.error(`[${optionsRef.current.name}] worker failed`, e.message);
          workerRef.current?.terminate();
          workerRef.current = null;
          deliver(latestIdRef.current, optionsRef.current.failureResult);
        };
        workerRef.current = worker;
      }
      workerRef.current.postMessage({ id, ...payload } satisfies WorkerRequest<TPayload>);
    },
    [deliver]
  );

  const cancel = useCallback(() => {
    latestIdRef.current++;
  }, []);

  return { start, cancel };
}
