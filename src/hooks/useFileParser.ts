import { useState, useCallback, useRef } from 'react';
import type { ParseFormat, WorkerMessage } from '@/workers/fileParser.worker';

/** File size limits (ADR-0009) */
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 MB hard cap
const WORKER_THRESHOLD = 1 * 1024 * 1024; // 1 MB — use worker above this size
const PROGRESS_BAR_THRESHOLD = 10 * 1024 * 1024; // 10 MB — show progress bar above this

export interface FileParseResult {
  output: string;
  error: string | null;
  fileName: string;
  fileSize: number;
}

export interface UseFileParserState {
  isParsing: boolean;
  progress: number; // 0–100
  showProgress: boolean;
  result: FileParseResult | null;
}

export interface UseFileParserActions {
  parseFile: (file: File, format: ParseFormat, indent?: number) => void;
  reset: () => void;
}

/**
 * Hook for parsing files — uses a Web Worker for files >1MB to keep the UI
 * thread responsive (ADR-0009). Returns progress for files >10MB.
 */
export function useFileParser(): UseFileParserState & UseFileParserActions {
  const [isParsing, setIsParsing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showProgress, setShowProgress] = useState(false);
  const [result, setResult] = useState<FileParseResult | null>(null);
  const workerRef = useRef<Worker | null>(null);

  const reset = useCallback(() => {
    // Terminate any in-flight worker
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    setIsParsing(false);
    setProgress(0);
    setShowProgress(false);
    setResult(null);
  }, []);

  const parseFile = useCallback((file: File, format: ParseFormat, indent = 2) => {
    if (file.size > MAX_FILE_SIZE) {
      setResult({
        output: '',
        error: `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 500 MB.`,
        fileName: file.name,
        fileSize: file.size,
      });
      return;
    }

    setIsParsing(true);
    setProgress(0);
    setShowProgress(file.size > PROGRESS_BAR_THRESHOLD);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text !== 'string') {
        setResult({
          output: '',
          error: 'Failed to read file.',
          fileName: file.name,
          fileSize: file.size,
        });
        setIsParsing(false);
        return;
      }

      if (file.size >= WORKER_THRESHOLD) {
        // Offload to Web Worker
        const worker = new Worker(new URL('../workers/fileParser.worker.ts', import.meta.url), {
          type: 'module',
        });
        workerRef.current = worker;

        worker.onmessage = (ev: MessageEvent<WorkerMessage>) => {
          const msg = ev.data;
          if (msg.type === 'progress') {
            setProgress(msg.percent);
          } else if (msg.type === 'result') {
            setResult({
              output: msg.output,
              error: null,
              fileName: file.name,
              fileSize: file.size,
            });
            setIsParsing(false);
            setProgress(100);
            worker.terminate();
            workerRef.current = null;
          } else {
            // msg.type === 'error'
            setResult({ output: '', error: msg.error, fileName: file.name, fileSize: file.size });
            setIsParsing(false);
            worker.terminate();
            workerRef.current = null;
          }
        };

        worker.onerror = (err) => {
          setResult({ output: '', error: err.message, fileName: file.name, fileSize: file.size });
          setIsParsing(false);
          worker.terminate();
          workerRef.current = null;
        };

        worker.postMessage({ type: 'parse', format, text, indent });
      } else {
        // Small files — parse on the main thread synchronously
        try {
          let output: string;
          if (format === 'json') {
            const parsed: unknown = JSON.parse(text);
            output = JSON.stringify(parsed, null, indent);
          } else {
            // csv / yaml — return raw text; the formatter hook handles actual parsing
            output = text;
          }
          setResult({ output, error: null, fileName: file.name, fileSize: file.size });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          setResult({ output: '', error: msg, fileName: file.name, fileSize: file.size });
        }
        setIsParsing(false);
        setProgress(100);
      }
    };

    reader.onerror = () => {
      setResult({
        output: '',
        error: 'Failed to read file.',
        fileName: file.name,
        fileSize: file.size,
      });
      setIsParsing(false);
    };

    reader.readAsText(file);
  }, []);

  return { isParsing, progress, showProgress, result, parseFile, reset };
}
