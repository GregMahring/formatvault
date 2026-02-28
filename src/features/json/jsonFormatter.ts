import JSON5 from 'json5';

export type IndentSize = 2 | 4 | 8;

export interface FormatOptions {
  indent: IndentSize;
  sortKeys: boolean;
  /** When true, parse with json5 first (allows trailing commas, comments) */
  relaxed: boolean;
  /** When true, use '\t' instead of numeric indent */
  indentWithTabs?: boolean;
}

export interface FormatResult {
  output: string;
  error: null;
  /** Present when input had curly/smart quotes that were normalised before parsing */
  normalisedQuotes?: true;
  /** Present when missing closing brackets/braces/parens were automatically appended */
  repaired?: true;
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

const CLOSER: Record<string, string> = { '{': '}', '[': ']', '(': ')' };
const OPENER = new Set(['{', '[', '(']);
const MATCH: Record<string, string> = { '}': '{', ']': '[', ')': '(' };

/**
 * Append missing closing brackets/braces/parens to JSON-like input.
 *
 * Strategy: scan character-by-character maintaining a stack of unclosed openers.
 * - Content inside strings (including escaped chars) is skipped entirely.
 * - JSON5 single-line (//) and block (/* *\/) comments are skipped.
 * - If a closer is encountered that doesn't match the top of the stack, bail
 *   (mismatched brackets are ambiguous; we don't guess what was intended).
 * - At end-of-input, append closers for any remaining open openers in LIFO order.
 *
 * Returns `{ repaired, changed }`. `changed` is false when the input was already
 * balanced or when a mismatch was detected (input returned as-is in both cases).
 */
export function repairUnmatchedBrackets(
  input: string,
  relaxed = false
): { repaired: string; changed: boolean } {
  const stack: string[] = [];
  let i = 0;
  const n = input.length;

  while (i < n) {
    const ch = input[i] ?? '';

    // String literal — skip to closing unescaped quote
    if (ch === '"' || (relaxed && ch === "'")) {
      const quote = ch;
      i++;
      while (i < n) {
        const sc = input[i] ?? '';
        if (sc === '\\') {
          i += 2; // skip escaped character
          continue;
        }
        if (sc === quote) {
          i++;
          break;
        }
        i++;
      }
      continue;
    }

    // JSON5 single-line comment
    if (relaxed && ch === '/' && (input[i + 1] ?? '') === '/') {
      while (i < n && (input[i] ?? '') !== '\n') i++;
      continue;
    }

    // JSON5 block comment
    if (relaxed && ch === '/' && (input[i + 1] ?? '') === '*') {
      i += 2;
      while (i < n - 1 && !((input[i] ?? '') === '*' && (input[i + 1] ?? '') === '/')) i++;
      i += 2; // skip closing */
      continue;
    }

    if (OPENER.has(ch)) {
      stack.push(ch);
      i++;
      continue;
    }

    if (ch === '}' || ch === ']' || ch === ')') {
      const expected = MATCH[ch];
      if (stack.length === 0 || stack[stack.length - 1] !== expected) {
        // Mismatched closer — bail, return original
        return { repaired: input, changed: false };
      }
      stack.pop();
      i++;
      continue;
    }

    i++;
  }

  if (stack.length === 0) return { repaired: input, changed: false };

  // Append missing closers in LIFO order
  const closers = stack
    .reverse()
    .map((op) => CLOSER[op] ?? '')
    .join('');
  return { repaired: input + closers, changed: true };
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

  const { normalised, changed: quotesChanged } = normaliseCurlyQuotes(trimmed);

  let parsed: unknown;
  let bracketRepaired = false;

  // First attempt: parse as-is (after quote normalisation)
  let firstError: { msg: string; pos: { line?: number; column?: number } } | null = null;
  try {
    parsed = options.relaxed ? JSON5.parse(normalised) : JSON.parse(normalised);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    firstError = { msg, pos: extractPosition(msg) };
  }

  if (firstError !== null) {
    // Second attempt: repair unmatched brackets, then re-parse
    const { repaired, changed } = repairUnmatchedBrackets(normalised, options.relaxed);
    if (changed) {
      try {
        parsed = options.relaxed ? JSON5.parse(repaired) : JSON.parse(repaired);
        bracketRepaired = true;
        firstError = null;
      } catch (err2) {
        const msg = err2 instanceof Error ? err2.message : String(err2);
        const pos = extractPosition(msg);
        return { output: null, error: msg, ...pos };
      }
    }
    if (firstError !== null) {
      return { output: null, error: firstError.msg, ...firstError.pos };
    }
  }

  const data = options.sortKeys ? sortObjectKeys(parsed) : parsed;

  try {
    const indentArg: string | number = options.indentWithTabs === true ? '\t' : options.indent;
    const output = JSON.stringify(data, null, indentArg);
    return {
      output,
      error: null,
      ...(quotesChanged ? { normalisedQuotes: true } : {}),
      ...(bracketRepaired ? { repaired: true } : {}),
    };
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
  const { normalised, changed: quotesChanged } = normaliseCurlyQuotes(trimmed);

  let parsed: unknown;
  let bracketRepaired = false;
  let firstError: { msg: string; pos: { line?: number; column?: number } } | null = null;

  try {
    parsed = relaxed ? JSON5.parse(normalised) : JSON.parse(normalised);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    firstError = { msg, pos: extractPosition(msg) };
  }

  if (firstError !== null) {
    const { repaired, changed } = repairUnmatchedBrackets(normalised, relaxed);
    if (changed) {
      try {
        parsed = relaxed ? JSON5.parse(repaired) : JSON.parse(repaired);
        bracketRepaired = true;
        firstError = null;
      } catch (err2) {
        const msg = err2 instanceof Error ? err2.message : String(err2);
        const pos = extractPosition(msg);
        return { output: null, error: msg, ...pos };
      }
    }
    if (firstError !== null) {
      return { output: null, error: firstError.msg, ...firstError.pos };
    }
  }

  return {
    output: JSON.stringify(parsed),
    error: null,
    ...(quotesChanged ? { normalisedQuotes: true } : {}),
    ...(bracketRepaired ? { repaired: true } : {}),
  };
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
