import { describe, it, expect } from 'vitest';
import {
  parseTimestamp,
  isTimestampError,
  detectUnit,
  dateStringToTimestamps,
  nowSeconds,
  toDatetimeLocalValue,
  type TimestampParseResult,
} from './timestampConverter';

function assertTimestamp(r: ReturnType<typeof parseTimestamp>): TimestampParseResult {
  if (isTimestampError(r)) throw new Error(`Unexpected error: ${r.error}`);
  return r;
}

function assertNotNull<T>(v: T | null): T {
  if (v === null) throw new Error('Expected non-null value');
  return v;
}

// ── detectUnit ────────────────────────────────────────────────────────────────

describe('detectUnit', () => {
  it('treats values below 10^10 as seconds', () => {
    expect(detectUnit(0)).toBe('seconds');
    expect(detectUnit(1_000_000_000)).toBe('seconds'); // ~Sept 2001
    expect(detectUnit(9_999_999_999)).toBe('seconds'); // just below threshold
  });

  it('treats values at/above 10^10 as milliseconds', () => {
    expect(detectUnit(10_000_000_000)).toBe('milliseconds');
    expect(detectUnit(1_700_000_000_000)).toBe('milliseconds'); // ~Nov 2023 in ms
  });

  it('treats negative values by absolute magnitude', () => {
    expect(detectUnit(-1_000_000_000)).toBe('seconds');
    expect(detectUnit(-10_000_000_000)).toBe('milliseconds');
  });
});

// ── parseTimestamp — valid inputs ─────────────────────────────────────────────

describe('parseTimestamp — valid inputs', () => {
  it('parses Unix epoch (0 seconds)', () => {
    const r = assertTimestamp(parseTimestamp('0'));
    expect(r.breakdown.seconds).toBe(0);
    expect(r.breakdown.milliseconds).toBe(0);
    expect(r.breakdown.iso).toBe('1970-01-01T00:00:00.000Z');
    expect(r.detectedUnit).toBe('seconds');
  });

  it('parses 1 second correctly', () => {
    const r = assertTimestamp(parseTimestamp('1'));
    expect(r.breakdown.iso).toBe('1970-01-01T00:00:01.000Z');
    expect(r.breakdown.seconds).toBe(1);
    expect(r.breakdown.milliseconds).toBe(1000);
  });

  it('parses 86400 seconds (1 day after epoch)', () => {
    const r = assertTimestamp(parseTimestamp('86400'));
    expect(r.breakdown.iso).toBe('1970-01-02T00:00:00.000Z');
    expect(r.breakdown.seconds).toBe(86400);
  });

  it('auto-detects seconds for values < 10^10', () => {
    const r = assertTimestamp(parseTimestamp('1000000000'));
    expect(r.detectedUnit).toBe('seconds');
    expect(r.breakdown.milliseconds).toBe(1_000_000_000_000);
  });

  it('auto-detects milliseconds for values >= 10^10', () => {
    const r = assertTimestamp(parseTimestamp('1000000000000'));
    expect(r.detectedUnit).toBe('milliseconds');
    expect(r.breakdown.seconds).toBe(1_000_000_000);
  });

  it('forces seconds unit even for large value', () => {
    const r = assertTimestamp(parseTimestamp('10000000000', 'seconds'));
    expect(r.detectedUnit).toBe('seconds');
    expect(r.breakdown.milliseconds).toBe(10_000_000_000_000);
  });

  it('forces milliseconds unit for small value', () => {
    const r = assertTimestamp(parseTimestamp('86400000', 'milliseconds'));
    expect(r.detectedUnit).toBe('milliseconds');
    expect(r.breakdown.seconds).toBe(86400);
  });

  it('ISO string is always in UTC (ends with Z)', () => {
    const r = assertTimestamp(parseTimestamp('1700000000'));
    expect(r.breakdown.iso).toMatch(/Z$/);
  });

  it('ISO string is valid ISO 8601 format', () => {
    const r = assertTimestamp(parseTimestamp('1700000000'));
    const d = new Date(r.breakdown.iso);
    expect(isNaN(d.getTime())).toBe(false);
  });

  it('breakdown seconds and milliseconds are consistent', () => {
    const r = assertTimestamp(parseTimestamp('1700000000'));
    expect(r.breakdown.milliseconds).toBe(r.breakdown.seconds * 1000);
  });

  it('parses negative timestamp (before epoch)', () => {
    const r = assertTimestamp(parseTimestamp('-86400'));
    expect(r.breakdown.iso).toBe('1969-12-31T00:00:00.000Z');
    expect(r.breakdown.seconds).toBe(-86400);
  });

  it('trims whitespace', () => {
    expect(isTimestampError(parseTimestamp('  86400  '))).toBe(false);
  });

  it('breakdown includes utc, local, localTimezone, relative fields', () => {
    const r = assertTimestamp(parseTimestamp('0'));
    expect(typeof r.breakdown.utc).toBe('string');
    expect(r.breakdown.utc.length).toBeGreaterThan(0);
    expect(typeof r.breakdown.local).toBe('string');
    expect(typeof r.breakdown.localTimezone).toBe('string');
    expect(typeof r.breakdown.relative).toBe('string');
  });
});

// ── parseTimestamp — errors ───────────────────────────────────────────────────

describe('parseTimestamp — errors', () => {
  it('returns error for empty string', () => {
    expect(isTimestampError(parseTimestamp(''))).toBe(true);
  });

  it('returns error for whitespace only', () => {
    expect(isTimestampError(parseTimestamp('   '))).toBe(true);
  });

  it('returns error for non-numeric input', () => {
    expect(isTimestampError(parseTimestamp('abc'))).toBe(true);
  });

  it('returns error for "now"', () => {
    expect(isTimestampError(parseTimestamp('now'))).toBe(true);
  });

  it('returns error for Infinity', () => {
    expect(isTimestampError(parseTimestamp('Infinity'))).toBe(true);
  });

  it('error has non-empty message', () => {
    const r = parseTimestamp('notanumber');
    expect(isTimestampError(r)).toBe(true);
    expect((r as { error: string }).error.length).toBeGreaterThan(0);
  });
});

// ── dateStringToTimestamps ────────────────────────────────────────────────────

describe('dateStringToTimestamps', () => {
  it('returns null for empty string', () => {
    expect(dateStringToTimestamps('')).toBeNull();
  });

  it('returns null for invalid date string', () => {
    expect(dateStringToTimestamps('not-a-date')).toBeNull();
  });

  it('returns seconds and milliseconds for valid input', () => {
    const result = assertNotNull(dateStringToTimestamps('1970-01-01T00:00'));
    expect(typeof result.seconds).toBe('number');
    expect(typeof result.milliseconds).toBe('number');
    expect(result.milliseconds).toBe(result.seconds * 1000);
  });

  it('seconds and milliseconds are consistent', () => {
    const result = assertNotNull(dateStringToTimestamps('2025-06-15T12:00'));
    expect(result.milliseconds).toBe(result.seconds * 1000);
  });
});

// ── nowSeconds ───────────────────────────────────────────────────────────────

describe('nowSeconds', () => {
  it('returns a non-empty string', () => {
    expect(nowSeconds().length).toBeGreaterThan(0);
  });

  it('returns a parseable integer', () => {
    const s = nowSeconds();
    expect(Number.isInteger(Number(s))).toBe(true);
  });

  it('returns a value near the current time', () => {
    const before = Math.floor(Date.now() / 1000);
    const s = Number(nowSeconds());
    const after = Math.ceil(Date.now() / 1000);
    expect(s).toBeGreaterThanOrEqual(before);
    expect(s).toBeLessThanOrEqual(after);
  });
});

// ── toDatetimeLocalValue ──────────────────────────────────────────────────────

describe('toDatetimeLocalValue', () => {
  it('returns a string in YYYY-MM-DDTHH:mm format', () => {
    const d = new Date(0); // epoch
    const s = toDatetimeLocalValue(d);
    expect(s).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  });

  it('roundtrips: toDatetimeLocalValue → dateStringToTimestamps → same ms (±60s for minute granularity)', () => {
    const now = new Date();
    const dtLocalStr = toDatetimeLocalValue(now);
    const result = assertNotNull(dateStringToTimestamps(dtLocalStr));
    // Allow ±60s since toDatetimeLocalValue truncates to minutes
    expect(Math.abs(result.milliseconds - now.getTime())).toBeLessThan(60_000);
  });
});
