/**
 * PII detection and masking utility.
 * All processing is client-side — no data leaves the browser (ADR-0001).
 *
 * Detects: emails, IPv4, phone numbers, API keys, AWS keys, credit cards (Luhn), UUIDs.
 * Replaces with deterministic placeholders: [EMAIL-1], [IP-1], etc.
 */

export type PiiCategory = 'EMAIL' | 'IP' | 'PHONE' | 'KEY' | 'AWS_KEY' | 'CC' | 'UUID';

export interface PiiMatch {
  category: PiiCategory;
  original: string;
  placeholder: string;
  start: number;
  end: number;
}

export interface MaskResult {
  masked: string;
  matches: PiiMatch[];
  summary: Partial<Record<PiiCategory, number>>;
  totalCount: number;
}

// ── Luhn validation for credit cards ─────────────────────────────────────────

function passesLuhn(digits: string): boolean {
  let sum = 0;
  let alternate = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = Number(digits[i]);
    if (alternate) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alternate = !alternate;
  }
  return sum % 10 === 0;
}

// ── Pattern definitions ──────────────────────────────────────────────────────

interface PatternDef {
  category: PiiCategory;
  regex: RegExp;
  /** Optional post-match validation (e.g. Luhn for credit cards) */
  validate?: (match: string) => boolean;
}

const PATTERNS: PatternDef[] = [
  // AWS access key IDs (very specific prefix — check first)
  {
    category: 'AWS_KEY',
    regex: /\bAKIA[0-9A-Z]{16}\b/g,
  },
  // Common API key/token prefixes
  {
    category: 'KEY',
    regex:
      /\b(?:sk-[a-zA-Z0-9]{20,}|sk_(?:live|test)_[a-zA-Z0-9]{20,}|pk_(?:live|test)_[a-zA-Z0-9]{20,}|ghp_[a-zA-Z0-9]{36}|gho_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9_]{80,})\b/g,
  },
  // Email addresses
  {
    category: 'EMAIL',
    regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  },
  // IPv4 addresses
  {
    category: 'IP',
    regex: /\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b/g,
  },
  // Phone numbers — require + prefix or ( to reduce false positives
  {
    category: 'PHONE',
    regex:
      /(?:\+\d{1,3}[-.\s]?)?\(\d{3}\)[-.\s]?\d{3}[-.\s]?\d{4}\b|\+\d{1,3}[-.\s]?\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
  },
  // Credit card numbers (16-digit groups, validated with Luhn)
  {
    category: 'CC',
    regex: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
    validate: (match) => {
      const digits = match.replace(/[-\s]/g, '');
      return digits.length === 16 && passesLuhn(digits);
    },
  },
  // UUIDs
  {
    category: 'UUID',
    regex: /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,
  },
];

// ── Core masking function ────────────────────────────────────────────────────

interface RawMatch {
  category: PiiCategory;
  original: string;
  start: number;
  end: number;
}

/**
 * Detect and mask PII patterns in a string.
 * Returns the masked string, all matches, and a summary count.
 */
export function maskPii(input: string): MaskResult {
  if (!input) {
    return { masked: '', matches: [], summary: {}, totalCount: 0 };
  }

  // Collect all raw matches
  const rawMatches: RawMatch[] = [];

  for (const pattern of PATTERNS) {
    const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
    let match: RegExpExecArray | null;

    while ((match = regex.exec(input)) !== null) {
      const original = match[0];
      if (pattern.validate && !pattern.validate(original)) continue;

      rawMatches.push({
        category: pattern.category,
        original,
        start: match.index,
        end: match.index + original.length,
      });
    }
  }

  // Sort by start position, then by length descending (longer match wins for overlaps)
  rawMatches.sort((a, b) => a.start - b.start || b.end - a.end);

  // Deduplicate overlapping ranges — keep the first (higher priority / longer)
  const deduped: RawMatch[] = [];
  let lastEnd = -1;
  for (const m of rawMatches) {
    if (m.start >= lastEnd) {
      deduped.push(m);
      lastEnd = m.end;
    }
  }

  // Assign deterministic numbered placeholders per category
  const counters: Partial<Record<PiiCategory, number>> = {};
  const matches: PiiMatch[] = deduped.map((m) => {
    const count = (counters[m.category] ?? 0) + 1;
    counters[m.category] = count;
    return {
      ...m,
      placeholder: `[${m.category}-${String(count)}]`,
    };
  });

  // Build masked string — replace from end to start to preserve indices
  let masked = input;
  for (let i = matches.length - 1; i >= 0; i--) {
    const m = matches[i];
    if (!m) continue;
    masked = masked.slice(0, m.start) + m.placeholder + masked.slice(m.end);
  }

  // Build summary
  const summary: Partial<Record<PiiCategory, number>> = {};
  for (const m of matches) {
    summary[m.category] = (summary[m.category] ?? 0) + 1;
  }

  return { masked, matches, summary, totalCount: matches.length };
}

/**
 * Reverse masking — restore original values from placeholders.
 */
export function unmaskPii(masked: string, matches: PiiMatch[]): string {
  let result = masked;
  // Replace from end to start to preserve positions
  for (let i = matches.length - 1; i >= 0; i--) {
    const m = matches[i];
    if (!m) continue;
    result = result.replace(m.placeholder, m.original);
  }
  return result;
}
