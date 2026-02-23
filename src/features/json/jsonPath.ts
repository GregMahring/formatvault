import { JSONPath } from 'jsonpath-plus';

export interface QueryResult {
  results: unknown[];
  error: null;
}

export interface QueryError {
  results: null;
  error: string;
}

export type JsonQueryResult = QueryResult | QueryError;

/**
 * Run a JSONPath query against parsed JSON input.
 * Returns the matched values or a structured error.
 */
export function queryJson(input: string, path: string): JsonQueryResult {
  if (!input.trim()) {
    return { results: null, error: 'Input is empty.' };
  }
  if (!path.trim()) {
    return { results: null, error: 'JSONPath expression is empty.' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { results: null, error: `Invalid JSON: ${msg}` };
  }

  try {
    const results = JSONPath({ path, json: parsed }) as unknown[];
    return { results, error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { results: null, error: `JSONPath error: ${msg}` };
  }
}

/** Format query results as pretty-printed JSON for display. */
export function formatQueryResults(results: unknown[]): string {
  if (results.length === 0) return '[]';
  if (results.length === 1) return JSON.stringify(results[0], null, 2);
  return JSON.stringify(results, null, 2);
}
