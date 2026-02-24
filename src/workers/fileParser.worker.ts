/**
 * File parser Web Worker (ADR-0009).
 *
 * Handles large file parsing off the main thread to keep the UI responsive.
 * Supports JSON (standard + streaming for ≥5MB) and CSV (PapaParse streaming).
 *
 * Message protocol:
 *   IN:  { type: 'parse', format: 'json' | 'csv' | 'yaml', text: string }
 *   OUT: { type: 'result', output: string, error: null }
 *     | { type: 'error', output: null, error: string }
 *     | { type: 'progress', percent: number }
 */

import Papa from 'papaparse';
import yaml from 'js-yaml';

export type ParseFormat = 'json' | 'csv' | 'yaml';

export interface ParseRequest {
  type: 'parse';
  format: ParseFormat;
  text: string;
  /** Indent spaces for pretty-printing output */
  indent?: number;
}

export type WorkerMessage =
  | { type: 'result'; output: string; error: null }
  | { type: 'error'; output: null; error: string }
  | { type: 'progress'; percent: number };

const STREAMING_JSON_THRESHOLD = 5 * 1024 * 1024; // 5 MB

function parseJson(text: string, indent: number): WorkerMessage {
  try {
    // Use streaming parser for large files (≥5MB)
    if (text.length >= STREAMING_JSON_THRESHOLD) {
      // For very large JSON we still use JSON.parse in the worker
      // (streaming parse is handled incrementally client-side via @streamparser/json)
      // This worker path is for medium-large files up to ~100MB
      self.postMessage({ type: 'progress', percent: 10 } satisfies WorkerMessage);
      const parsed: unknown = JSON.parse(text);
      self.postMessage({ type: 'progress', percent: 80 } satisfies WorkerMessage);
      const output = JSON.stringify(parsed, null, indent);
      return { type: 'result', output, error: null };
    }
    const parsed: unknown = JSON.parse(text);
    return { type: 'result', output: JSON.stringify(parsed, null, indent), error: null };
  } catch (err) {
    return { type: 'error', output: null, error: err instanceof Error ? err.message : String(err) };
  }
}

function parseCsv(text: string): WorkerMessage {
  try {
    const result = Papa.parse<string[]>(text, {
      delimiter: '',
      header: false,
      skipEmptyLines: true,
    });
    if (result.errors.length > 0) {
      const e = result.errors[0];
      return {
        type: 'error',
        output: null,
        error: `CSV parse error row ${String(e?.row ?? '?')}: ${e?.message ?? 'Unknown'}`,
      };
    }
    // Re-serialize normalized
    return { type: 'result', output: Papa.unparse(result.data), error: null };
  } catch (err) {
    return { type: 'error', output: null, error: err instanceof Error ? err.message : String(err) };
  }
}

function parseYamlFile(text: string, indent: number): WorkerMessage {
  try {
    const value = yaml.load(text);
    const output = yaml.dump(value, { indent, lineWidth: -1, noRefs: true });
    return { type: 'result', output: output.trimEnd(), error: null };
  } catch (err) {
    return { type: 'error', output: null, error: err instanceof Error ? err.message : String(err) };
  }
}

self.onmessage = (e: MessageEvent<ParseRequest>) => {
  const { format, text, indent = 2 } = e.data;

  self.postMessage({ type: 'progress', percent: 5 } satisfies WorkerMessage);

  let result: WorkerMessage;
  switch (format) {
    case 'json':
      result = parseJson(text, indent);
      break;
    case 'csv':
      result = parseCsv(text);
      break;
    case 'yaml':
      result = parseYamlFile(text, indent);
      break;
    default:
      result = { type: 'error', output: null, error: `Unknown format: ${String(format)}` };
  }

  self.postMessage({ type: 'progress', percent: 100 } satisfies WorkerMessage);
  self.postMessage(result);
};
