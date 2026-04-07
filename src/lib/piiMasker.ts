/**
 * PII detection and masking utility.
 * All processing is client-side — no data leaves the browser (ADR-0001).
 *
 * Value-pattern detectors (match on the value itself):
 *   emails, IPv4, phone numbers, API keys, AWS keys,
 *   credit cards (Luhn-validated), UUIDs, SSNs (XXX-XX-XXXX), IBANs (MOD-97).
 *
 * Key-name detectors (match field name + value in structured data):
 *   date of birth, driver's license, passport number.
 *   These match JSON/YAML/TOML key-value syntax and mask the value regardless
 *   of its format — the field name is the reliable signal, not the value shape.
 *
 * Replaces with deterministic placeholders: [EMAIL-1], [DOB-1], etc.
 */

export type PiiCategory =
  | 'EMAIL'
  | 'IP'
  | 'PHONE'
  | 'KEY'
  | 'AWS_KEY'
  | 'CC'
  | 'UUID'
  | 'SSN'
  | 'IBAN'
  | 'DOB'
  | 'DL'
  | 'PASSPORT';

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

// ── Validators ───────────────────────────────────────────────────────────────

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

function isValidSsn(match: string): boolean {
  const digits = match.replace(/-/g, '');
  const area = parseInt(digits.slice(0, 3), 10);
  const group = parseInt(digits.slice(3, 5), 10);
  const serial = parseInt(digits.slice(5, 9), 10);
  // SSA never issues these ranges
  if (area === 0 || area === 666 || area >= 900) return false;
  if (group === 0) return false;
  if (serial === 0) return false;
  return true;
}

function isValidIban(raw: string): boolean {
  const iban = raw.replace(/[\s-]/g, '').toUpperCase();
  // 2-letter country code + 2 check digits + 11–30 alphanumeric BBAN = 15–34 chars
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(iban)) return false;
  // MOD-97: move first 4 chars to end, replace letters with A=10…Z=35, check % 97 === 1
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  const numeric = rearranged.replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55));
  let remainder = 0;
  for (const ch of numeric) {
    remainder = (remainder * 10 + Number(ch)) % 97;
  }
  return remainder === 1;
}

// ── Pattern definitions ──────────────────────────────────────────────────────

interface PatternDef {
  category: PiiCategory;
  regex: RegExp;
  /** Optional post-match validation (e.g. Luhn, MOD-97, SSN range checks) */
  validate?: (match: string) => boolean;
  /**
   * When set, mask only capture group N (1-based) instead of the full match.
   * The regex must carry the `d` flag (hasIndices) so JS exposes group positions.
   * Surrounding quotes are stripped automatically to preserve JSON/YAML structure.
   */
  valueGroup?: number;
}

// ── Key-value pattern builder ─────────────────────────────────────────────────
// Matches `"key": value` (JSON) or `key: value` / `key = value` (YAML/TOML).
// The value is captured in group 1 — only that portion is masked.

const QUOTED_VAL = String.raw`(?:"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')`;
const BARE_VAL = String.raw`[^\s,}\]\n"']+`; // stops at whitespace, terminators, quotes
const ANY_VAL = `(?:${QUOTED_VAL}|${BARE_VAL})`;
const KV_SEP = String.raw`\s*[=:]\s*`;

function kvDef(category: PiiCategory, keys: string[]): PatternDef {
  const keyAlt = keys.join('|');
  // Quoted JSON key OR bare YAML/TOML key — both case-insensitive via 'i' flag
  // Quoted key ("key"): no \b needed — closing " already terminates the match.
  // Bare key (key): \b on both sides to avoid partial-word matches.
  const keyPart = `(?:"(?:${keyAlt})"|\\b(?:${keyAlt})\\b)`;
  return {
    category,
    // d = hasIndices (group positions), i = case-insensitive, g = global
    regex: new RegExp(`${keyPart}${KV_SEP}(${ANY_VAL})`, 'gid'),
    valueGroup: 1,
  };
}

// ── Pattern list ──────────────────────────────────────────────────────────────

const PATTERNS: PatternDef[] = [
  // ── Value-pattern detectors ────────────────────────────────────────────────

  // AWS access key IDs (very specific prefix — highest priority, check first)
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
  // Credit card numbers (16-digit groups, Luhn-validated)
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
  // US Social Security Numbers — formatted only (XXX-XX-XXXX) to avoid false positives
  {
    category: 'SSN',
    regex: /\b\d{3}-\d{2}-\d{4}\b/g,
    validate: isValidSsn,
  },
  // IBANs — compact form, MOD-97 validated (15–34 chars: CC DD + 11–30 alphanumeric)
  {
    category: 'IBAN',
    regex: /\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b/gi,
    validate: isValidIban,
  },

  // ── Key-name detectors (JSON / YAML / TOML structured data) ───────────────

  kvDef('DOB', [
    'dob',
    'date_of_birth',
    'dateofbirth',
    'dateOfBirth',
    'birth_date',
    'birthdate',
    'birthDate',
    'birthday',
    'birth_day',
  ]),
  kvDef('DL', [
    'dl',
    'dl_number',
    'dl_no',
    'dlNumber',
    'dlNo',
    'drivers_license',
    'driver_license',
    'driversLicense',
    'driverLicense',
    'drivers_licence',
    'driver_licence',
    'driversLicence',
    'driverLicence',
    'driving_license',
    'driving_licence',
    'drivingLicense',
    'drivingLicence',
    'license_number',
    'licence_number',
    'licenseNumber',
    'licenceNumber',
  ]),
  kvDef('PASSPORT', [
    'passport',
    'passport_number',
    'passport_no',
    'passport_id',
    'passportNumber',
    'passportNo',
    'passportId',
  ]),
];

// ── Core masking function ─────────────────────────────────────────────────────

interface RawMatch {
  category: PiiCategory;
  original: string;
  start: number;
  end: number;
}

// RegExpExecArray extended with the `d` flag's indices property (ES2022+)
type IndexedExecArray = RegExpExecArray & {
  indices?: readonly (readonly [number, number] | undefined)[];
};

/**
 * Detect and mask PII patterns in a string.
 * Returns the masked string, all matches with their placeholders, and a summary.
 */
export function maskPii(input: string): MaskResult {
  if (!input) {
    return { masked: '', matches: [], summary: {}, totalCount: 0 };
  }

  const rawMatches: RawMatch[] = [];

  for (const pattern of PATTERNS) {
    const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
    let m: RegExpExecArray | null;

    while ((m = regex.exec(input)) !== null) {
      let original: string;
      let start: number;
      let end: number;

      if (pattern.valueGroup !== undefined) {
        // Key-value pattern: extract position from the value capture group
        const indexed = m as IndexedExecArray;
        const groupIndices = indexed.indices?.[pattern.valueGroup];
        if (!groupIndices) continue;

        let [gStart, gEnd] = groupIndices;
        let value = m[pattern.valueGroup] ?? '';

        // Strip surrounding quotes to preserve JSON/YAML structure after replacement
        if (
          value.length >= 2 &&
          ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'")))
        ) {
          value = value.slice(1, -1);
          gStart += 1;
          gEnd -= 1;
        }

        if (!value) continue;
        original = value;
        start = gStart;
        end = gEnd;
      } else {
        original = m[0];
        start = m.index;
        end = m.index + original.length;
      }

      if (pattern.validate && !pattern.validate(original)) continue;

      rawMatches.push({ category: pattern.category, original, start, end });
    }
  }

  // Sort by start position, then longer match first (wins overlapping ranges)
  rawMatches.sort((a, b) => a.start - b.start || b.end - a.end);

  // Deduplicate overlapping ranges — keep the first (highest priority / longest)
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
    return { ...m, placeholder: `[${m.category}-${String(count)}]` };
  });

  // Build masked string — replace from end to start to preserve indices
  let masked = input;
  for (let i = matches.length - 1; i >= 0; i--) {
    const m = matches[i];
    if (!m) continue;
    masked = masked.slice(0, m.start) + m.placeholder + masked.slice(m.end);
  }

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
  for (let i = matches.length - 1; i >= 0; i--) {
    const m = matches[i];
    if (!m) continue;
    result = result.replace(m.placeholder, m.original);
  }
  return result;
}
