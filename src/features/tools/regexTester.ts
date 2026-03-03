/**
 * Pure regex testing utilities — no React, no side effects.
 *
 * Caller note (ADR-0008): before rendering highlightMatches output with
 * dangerouslySetInnerHTML, sanitize with:
 *   DOMPurify.sanitize(html, { ALLOWED_TAGS: ['mark'], ALLOWED_ATTR: [] })
 */

export interface RegexFlags {
  global: boolean;
  ignoreCase: boolean;
  multiline: boolean;
  dotAll: boolean;
  unicode: boolean;
  hasIndices: boolean;
}

export interface RegexMatch {
  index: number;
  end: number;
  value: string;
  groups: (string | undefined)[];
  namedGroups: Record<string, string | undefined> | null;
}

export interface RegexTestResult {
  matches: RegexMatch[];
  error: null;
}

export interface RegexTestError {
  matches: null;
  error: string;
}

export type RegexResult = RegexTestResult | RegexTestError;

export const DEFAULT_FLAGS: RegexFlags = {
  global: true,
  ignoreCase: false,
  multiline: false,
  dotAll: false,
  unicode: false,
  hasIndices: false,
};

/** Maps each flag field to its RegExp flag letter. */
const FLAG_LETTERS: Record<keyof RegexFlags, string> = {
  global: 'g',
  ignoreCase: 'i',
  multiline: 'm',
  dotAll: 's',
  unicode: 'u',
  hasIndices: 'd',
};

/** Build the flag string passed to `new RegExp(pattern, flagStr)`. */
export function buildFlagString(flags: RegexFlags): string {
  return (Object.keys(FLAG_LETTERS) as (keyof RegexFlags)[])
    .filter((k) => flags[k])
    .map((k) => FLAG_LETTERS[k])
    .join('');
}

const MAX_MATCHES = 1000;

/** Test a regex pattern against an input string. Returns matches or an error. */
export function testRegex(pattern: string, flags: RegexFlags, input: string): RegexResult {
  if (!pattern) return { matches: [], error: null };

  const flagStr = buildFlagString(flags);
  let regex: RegExp;
  try {
    regex = new RegExp(pattern, flagStr);
  } catch (err) {
    return {
      matches: null,
      error: err instanceof Error ? err.message : 'Invalid regular expression.',
    };
  }

  const matches: RegexMatch[] = [];

  if (flags.global) {
    // matchAll handles zero-length matches correctly — no infinite loop risk
    const iter = input.matchAll(regex);
    for (const m of iter) {
      if (matches.length >= MAX_MATCHES) break;
      const groups = Array.from({ length: m.length - 1 }, (_, i) => m[i + 1]);
      matches.push({
        index: m.index,
        end: m.index + m[0].length,
        value: m[0],
        groups,
        namedGroups: m.groups ? { ...m.groups } : null,
      });
    }
  } else {
    const m = regex.exec(input);
    if (m !== null) {
      const groups = Array.from({ length: m.length - 1 }, (_, i) => m[i + 1]);
      matches.push({
        index: m.index,
        end: m.index + m[0].length,
        value: m[0],
        groups,
        namedGroups: m.groups ? { ...m.groups } : null,
      });
    }
  }

  return { matches, error: null };
}

/** Escape HTML special characters in a plain text segment. */
function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Build an HTML string with matched substrings wrapped in `<mark>` tags.
 * All text is HTML-escaped. Overlapping matches are skipped.
 *
 * IMPORTANT: The caller MUST sanitize the return value via DOMPurify before
 * using dangerouslySetInnerHTML (ADR-0008).
 */
export function highlightMatches(input: string, matches: RegexMatch[]): string {
  if (matches.length === 0) return escapeHtml(input);

  const parts: string[] = [];
  let cursor = 0;

  for (const match of matches) {
    // Skip overlapping matches
    if (match.index < cursor) continue;

    // Text before this match
    if (match.index > cursor) {
      parts.push(escapeHtml(input.slice(cursor, match.index)));
    }

    parts.push(`<mark>${escapeHtml(match.value)}</mark>`);
    cursor = match.end;
  }

  // Remaining text after the last match
  if (cursor < input.length) {
    parts.push(escapeHtml(input.slice(cursor)));
  }

  return parts.join('');
}
