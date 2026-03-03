/**
 * Unix timestamp conversion utilities.
 * All processing is client-side — no data leaves the browser (ADR-0001).
 *
 * Detection heuristic: values < 10^10 are treated as seconds (covers 1970–2286),
 * values ≥ 10^10 are treated as milliseconds (covers 1970–present+).
 */

export type TimestampUnit = 'seconds' | 'milliseconds';

export interface TimestampBreakdown {
  /** e.g. "Wed, Jan 1, 2025, 00:00:00 UTC" */
  utc: string;
  /** e.g. "Tue, Dec 31, 2024, 7:00:00 PM EST" */
  local: string;
  /** IANA timezone name of the browser, e.g. "America/New_York" */
  localTimezone: string;
  /** ISO 8601 with milliseconds, e.g. "2025-01-01T00:00:00.000Z" */
  iso: string;
  /** Human relative string, e.g. "3 months ago" */
  relative: string;
  /** Unix timestamp in whole seconds */
  seconds: number;
  /** Unix timestamp in milliseconds */
  milliseconds: number;
}

export interface TimestampParseResult {
  breakdown: TimestampBreakdown;
  /** The unit that was used (either forced or auto-detected) */
  detectedUnit: TimestampUnit;
  error: null;
}

export interface TimestampParseError {
  breakdown: null;
  detectedUnit: null;
  error: string;
}

export type TimestampResult = TimestampParseResult | TimestampParseError;

/** Values below this threshold are treated as seconds; at or above as milliseconds. */
const MS_THRESHOLD = 10_000_000_000;

export function isTimestampError(r: TimestampResult): r is TimestampParseError {
  return r.error !== null;
}

/**
 * Infer whether a numeric value is seconds or milliseconds based on magnitude.
 * Works for timestamps in the range 1970–2286 (seconds) or 1970–present (ms).
 */
export function detectUnit(value: number): TimestampUnit {
  return Math.abs(value) < MS_THRESHOLD ? 'seconds' : 'milliseconds';
}

/**
 * Parse a Unix timestamp string into a full TimestampBreakdown.
 * @param input   Raw string from user (e.g. "1735689600" or "1735689600000")
 * @param forceUnit  Override auto-detection; undefined = auto-detect
 */
export function parseTimestamp(input: string, forceUnit?: TimestampUnit): TimestampResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return { breakdown: null, detectedUnit: null, error: 'Enter a Unix timestamp.' };
  }

  const num = Number(trimmed);
  if (!Number.isFinite(num)) {
    return {
      breakdown: null,
      detectedUnit: null,
      error: 'Invalid input — enter a numeric Unix timestamp.',
    };
  }

  const unit = forceUnit ?? detectUnit(num);
  const ms = unit === 'seconds' ? Math.round(num) * 1000 : Math.round(num);
  const date = new Date(ms);

  if (isNaN(date.getTime())) {
    return {
      breakdown: null,
      detectedUnit: null,
      error: 'Timestamp is out of the valid date range.',
    };
  }

  return { breakdown: buildBreakdown(date), detectedUnit: unit, error: null };
}

function buildBreakdown(date: Date): TimestampBreakdown {
  const ms = date.getTime();
  const seconds = Math.floor(ms / 1000);

  const utcFormatter = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'UTC',
    timeZoneName: 'short',
  });

  const localFormatter = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  });

  const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return {
    utc: utcFormatter.format(date),
    local: localFormatter.format(date),
    localTimezone,
    iso: date.toISOString(),
    relative: formatRelative(ms),
    seconds,
    milliseconds: ms,
  };
}

function formatRelative(ms: number): string {
  const diffMs = ms - Date.now();
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  const absDiffMs = Math.abs(diffMs);

  if (absDiffMs < 60_000) {
    return rtf.format(Math.round(diffMs / 1000), 'second');
  }
  if (absDiffMs < 3_600_000) {
    return rtf.format(Math.round(diffMs / 60_000), 'minute');
  }
  if (absDiffMs < 86_400_000) {
    return rtf.format(Math.round(diffMs / 3_600_000), 'hour');
  }
  if (absDiffMs < 30 * 86_400_000) {
    return rtf.format(Math.round(diffMs / 86_400_000), 'day');
  }
  if (absDiffMs < 365 * 86_400_000) {
    return rtf.format(Math.round(diffMs / (30 * 86_400_000)), 'month');
  }
  return rtf.format(Math.round(diffMs / (365 * 86_400_000)), 'year');
}

/**
 * Convert a datetime-local string (e.g. "2025-01-01T00:00") to Unix timestamps.
 * Returns null if the string is empty or invalid.
 */
export function dateStringToTimestamps(
  isoString: string
): { seconds: number; milliseconds: number } | null {
  if (!isoString) return null;
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return null;
  const tsMs = d.getTime();
  return { seconds: Math.floor(tsMs / 1000), milliseconds: tsMs };
}

/**
 * Return the current time as a Unix timestamp string (seconds).
 */
export function nowSeconds(): string {
  return String(Math.floor(Date.now() / 1000));
}

/**
 * Format a Date as a value suitable for a datetime-local input ("YYYY-MM-DDTHH:mm").
 */
export function toDatetimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${String(date.getFullYear())}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}
