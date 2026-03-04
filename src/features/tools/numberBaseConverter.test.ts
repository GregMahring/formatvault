import { describe, it, expect } from 'vitest';
import {
  convertNumber,
  isNumberError,
  toAllBases,
  formatWithPrefix,
  type ConversionResult,
  type NumberBase,
} from './numberBaseConverter';

function assertConverted(r: ReturnType<typeof convertNumber>): ConversionResult {
  if (isNumberError(r)) throw new Error(`Unexpected error: ${r.error}`);
  return r;
}

// ── convertNumber — decimal input ─────────────────────────────────────────────

describe('convertNumber — from decimal', () => {
  it('converts 0', () => {
    const r = assertConverted(convertNumber('0', 10));
    expect(r.values[10]).toBe('0');
    expect(r.values[16]).toBe('0');
    expect(r.values[2]).toBe('0');
    expect(r.values[8]).toBe('0');
  });

  it('converts 255', () => {
    const r = assertConverted(convertNumber('255', 10));
    expect(r.values[16]).toBe('ff');
    expect(r.values[2]).toBe('11111111');
    expect(r.values[8]).toBe('377');
  });

  it('converts 256', () => {
    const r = assertConverted(convertNumber('256', 10));
    expect(r.values[16]).toBe('100');
    expect(r.values[2]).toBe('100000000');
    expect(r.values[8]).toBe('400');
  });

  it('converts 1', () => {
    const r = assertConverted(convertNumber('1', 10));
    expect(r.values[2]).toBe('1');
    expect(r.values[8]).toBe('1');
    expect(r.values[16]).toBe('1');
  });

  it('converts negative number', () => {
    const r = assertConverted(convertNumber('-1', 10));
    expect(r.values[10]).toBe('-1');
    expect(r.values[16]).toBe('-1');
    expect(r.values[2]).toBe('-1');
    expect(r.values[8]).toBe('-1');
  });

  it('converts -255', () => {
    const r = assertConverted(convertNumber('-255', 10));
    expect(r.values[16]).toBe('-ff');
    expect(r.values[2]).toBe('-11111111');
    expect(r.values[8]).toBe('-377');
  });

  it('converts 65535 (0xFFFF)', () => {
    const r = assertConverted(convertNumber('65535', 10));
    expect(r.values[16]).toBe('ffff');
    expect(r.values[2]).toBe('1111111111111111');
  });

  it('converts 2^32 - 1', () => {
    const r = assertConverted(convertNumber('4294967295', 10));
    expect(r.values[16]).toBe('ffffffff');
  });

  it('handles arbitrarily large numbers (BigInt)', () => {
    const big = '99999999999999999999999999';
    const r = assertConverted(convertNumber(big, 10));
    expect(r.values[10]).toBe(big);
  });

  it('trims whitespace', () => {
    expect(isNumberError(convertNumber('  255  ', 10))).toBe(false);
  });
});

// ── convertNumber — hex input ─────────────────────────────────────────────────

describe('convertNumber — from hex', () => {
  it('converts ff to 255 decimal', () => {
    expect(assertConverted(convertNumber('ff', 16)).values[10]).toBe('255');
  });

  it('converts uppercase FF', () => {
    expect(assertConverted(convertNumber('FF', 16)).values[10]).toBe('255');
  });

  it('converts mixed case (aB)', () => {
    expect(assertConverted(convertNumber('aB', 16)).values[10]).toBe('171');
  });

  it('converts negative hex -ff', () => {
    expect(assertConverted(convertNumber('-ff', 16)).values[10]).toBe('-255');
  });

  it('converts 0 in hex', () => {
    expect(assertConverted(convertNumber('0', 16)).values[10]).toBe('0');
  });

  it('converts deadbeef', () => {
    expect(assertConverted(convertNumber('deadbeef', 16)).values[10]).toBe('3735928559');
  });

  it('rejects g as invalid hex digit', () => {
    expect(isNumberError(convertNumber('gg', 16))).toBe(true);
  });
});

// ── convertNumber — binary input ──────────────────────────────────────────────

describe('convertNumber — from binary', () => {
  it('converts 11111111 to 255', () => {
    const r = assertConverted(convertNumber('11111111', 2));
    expect(r.values[10]).toBe('255');
    expect(r.values[16]).toBe('ff');
  });

  it('converts 0 in binary', () => {
    expect(assertConverted(convertNumber('0', 2)).values[10]).toBe('0');
  });

  it('converts 1 in binary', () => {
    expect(assertConverted(convertNumber('1', 2)).values[10]).toBe('1');
  });

  it('converts negative binary', () => {
    expect(assertConverted(convertNumber('-11111111', 2)).values[10]).toBe('-255');
  });

  it('rejects 2 as invalid binary digit', () => {
    expect(isNumberError(convertNumber('102', 2))).toBe(true);
  });

  it('rejects letters in binary', () => {
    expect(isNumberError(convertNumber('1a0', 2))).toBe(true);
  });
});

// ── convertNumber — octal input ───────────────────────────────────────────────

describe('convertNumber — from octal', () => {
  it('converts 377 to 255', () => {
    const r = assertConverted(convertNumber('377', 8));
    expect(r.values[10]).toBe('255');
    expect(r.values[16]).toBe('ff');
  });

  it('converts 0 in octal', () => {
    expect(assertConverted(convertNumber('0', 8)).values[10]).toBe('0');
  });

  it('converts negative octal', () => {
    expect(assertConverted(convertNumber('-377', 8)).values[10]).toBe('-255');
  });

  it('rejects 8 as invalid octal digit', () => {
    expect(isNumberError(convertNumber('8', 8))).toBe(true);
  });

  it('rejects 9 as invalid octal digit', () => {
    expect(isNumberError(convertNumber('9', 8))).toBe(true);
  });
});

// ── convertNumber — error cases ───────────────────────────────────────────────

describe('convertNumber — errors', () => {
  it('returns error for empty string', () => {
    expect(isNumberError(convertNumber('', 10))).toBe(true);
  });

  it('returns error for whitespace only', () => {
    expect(isNumberError(convertNumber('   ', 10))).toBe(true);
  });

  it('returns error for minus sign alone', () => {
    expect(isNumberError(convertNumber('-', 10))).toBe(true);
  });

  it('error has a non-empty message', () => {
    const r = convertNumber('xyz', 10);
    expect(isNumberError(r)).toBe(true);
    expect((r as { error: string }).error.length).toBeGreaterThan(0);
  });
});

// ── toAllBases ────────────────────────────────────────────────────────────────

describe('toAllBases', () => {
  it('converts 255n to all bases', () => {
    const v = toAllBases(255n);
    expect(v[10]).toBe('255');
    expect(v[16]).toBe('ff');
    expect(v[2]).toBe('11111111');
    expect(v[8]).toBe('377');
  });

  it('converts 0n to all bases', () => {
    const v = toAllBases(0n);
    expect(v[10]).toBe('0');
    expect(v[16]).toBe('0');
    expect(v[2]).toBe('0');
    expect(v[8]).toBe('0');
  });

  it('converts negative value correctly', () => {
    const v = toAllBases(-255n);
    expect(v[10]).toBe('-255');
    expect(v[16]).toBe('-ff');
    expect(v[2]).toBe('-11111111');
    expect(v[8]).toBe('-377');
  });
});

// ── formatWithPrefix ──────────────────────────────────────────────────────────

describe('formatWithPrefix', () => {
  it('adds 0x prefix for hex', () => {
    expect(formatWithPrefix('ff', 16)).toBe('0xff');
  });

  it('adds 0b prefix for binary', () => {
    expect(formatWithPrefix('11111111', 2)).toBe('0b11111111');
  });

  it('adds 0o prefix for octal', () => {
    expect(formatWithPrefix('377', 8)).toBe('0o377');
  });

  it('no prefix for decimal', () => {
    expect(formatWithPrefix('255', 10)).toBe('255');
  });

  it('preserves negative sign before prefix', () => {
    expect(formatWithPrefix('-ff', 16)).toBe('-0xff');
    expect(formatWithPrefix('-11111111', 2)).toBe('-0b11111111');
  });

  it('returns empty string unchanged', () => {
    expect(formatWithPrefix('', 16)).toBe('');
  });
});

// ── Roundtrip across all base pairs ──────────────────────────────────────────

describe('roundtrip across bases', () => {
  const testValues = ['0', '1', '255', '256', '1023', '65535'];
  const bases: NumberBase[] = [2, 8, 10, 16];

  for (const startVal of testValues) {
    for (const fromBase of bases) {
      it(`roundtrip decimal ${startVal} → base ${String(fromBase)} → back to decimal`, () => {
        const original = assertConverted(convertNumber(startVal, 10));
        const inBase = original.values[fromBase];
        const back = assertConverted(convertNumber(inBase, fromBase));
        expect(back.values[10]).toBe(startVal);
      });
    }
  }
});
