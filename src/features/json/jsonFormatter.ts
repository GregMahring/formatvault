import JSON5 from 'json5';

export type IndentSize = 2 | 4 | 8;

export interface FormatOptions {
  indent: IndentSize;
  sortKeys: boolean;
  /** When true, parse with json5 first (allows trailing commas, comments) */
  relaxed: boolean;
}

export interface FormatResult {
  output: string;
  error: null;
  /** Present when input had curly/smart quotes that were normalised before parsing */
  normalisedQuotes?: true;
}

export interface FormatError {
  output: null;
  error: string;
  /** 1-based line number if parseable from the error, otherwise undefined */
  line?: number;
  /** 1-based column if parseable from the error, otherwise undefined */
  column?: number;
}

export type JsonFormatResult = FormatResult | FormatError;

/**
 * Normalise curly/smart quotes and apostrophes to their plain ASCII equivalents.
 * Users frequently paste JSON from word processors (Word, Pages, Google Docs) or
 * macOS autocorrect which silently replaces " → " " and ' → ' '.
 * Returns `{ normalised, changed }` so callers can inform the user.
 */
export function normaliseCurlyQuotes(input: string): { normalised: string; changed: boolean } {
  const normalised = input
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'") // ' ' ‚ ‛ ′ ‵ → '
    .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"'); // " " „ ‟ ″ ‶ → "
  return { normalised, changed: normalised !== input };
}

/** Extract line/column from a native JSON.parse SyntaxError message. */
function extractPosition(msg: string): { line?: number; column?: number } {
  // Chrome/Node: "Unexpected token … at position N"
  const posMatch = /at position (\d+)/.exec(msg);
  if (posMatch?.[1]) {
    // position is a character offset — not directly a line/col, but better than nothing
    return {};
  }
  // Firefox/Safari: "JSON Parse error: … line N column N"
  const lineColMatch = /line (\d+) column (\d+)/i.exec(msg);
  if (lineColMatch?.[1] && lineColMatch[2]) {
    return { line: Number(lineColMatch[1]), column: Number(lineColMatch[2]) };
  }
  // json5 errors: "JSON5: invalid character … at 1:5"
  const json5Match = /at (\d+):(\d+)/.exec(msg);
  if (json5Match?.[1] && json5Match[2]) {
    return { line: Number(json5Match[1]), column: Number(json5Match[2]) };
  }
  return {};
}

function sortObjectKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortObjectKeys);
  }
  if (value !== null && typeof value === 'object') {
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      sorted[key] = sortObjectKeys((value as Record<string, unknown>)[key]);
    }
    return sorted;
  }
  return value;
}

/**
 * Parse and pretty-print JSON (or relaxed JSON5).
 * Returns either formatted output or a structured error with position info.
 */
export function formatJson(input: string, options: FormatOptions): JsonFormatResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return { output: null, error: 'Input is empty.' };
  }

  const { normalised, changed } = normaliseCurlyQuotes(trimmed);

  let parsed: unknown;

  try {
    parsed = options.relaxed ? JSON5.parse(normalised) : JSON.parse(normalised);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const pos = extractPosition(msg);
    return { output: null, error: msg, ...pos };
  }

  const data = options.sortKeys ? sortObjectKeys(parsed) : parsed;

  try {
    const output = JSON.stringify(data, null, options.indent);
    return { output, error: null, ...(changed ? { normalisedQuotes: true } : {}) };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { output: null, error: `Serialization error: ${msg}` };
  }
}

/** Minify: compact JSON output. */
export function minifyJson(input: string, relaxed = false): JsonFormatResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return { output: null, error: 'Input is empty.' };
  }
  const { normalised, changed } = normaliseCurlyQuotes(trimmed);
  try {
    const parsed: unknown = relaxed ? JSON5.parse(normalised) : JSON.parse(normalised);
    return {
      output: JSON.stringify(parsed),
      error: null,
      ...(changed ? { normalisedQuotes: true } : {}),
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const pos = extractPosition(msg);
    return { output: null, error: msg, ...pos };
  }
}

/** Validate only — returns error info or null on success. */
export function validateJson(input: string, relaxed = false): FormatError | null {
  const trimmed = input.trim();
  if (!trimmed) {
    return { output: null, error: 'Input is empty.' };
  }
  const { normalised } = normaliseCurlyQuotes(trimmed);
  try {
    // Parse to validate — result intentionally discarded
    if (relaxed) {
      JSON5.parse(normalised);
    } else {
      JSON.parse(normalised);
    }
    return null;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const pos = extractPosition(msg);
    return { output: null, error: msg, ...pos };
  }
}
