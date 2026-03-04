/**
 * Number base conversion utilities.
 * Supports binary (2), octal (8), decimal (10), and hexadecimal (16).
 * Uses BigInt for arbitrary-precision integers.
 * All processing is client-side — no data leaves the browser (ADR-0001).
 */

export type NumberBase = 2 | 8 | 10 | 16;

export const BASES: { base: NumberBase; label: string; prefix: string; placeholder: string }[] = [
  { base: 10, label: 'DEC', prefix: '', placeholder: '255' },
  { base: 16, label: 'HEX', prefix: '0x', placeholder: 'ff' },
  { base: 2, label: 'BIN', prefix: '0b', placeholder: '11111111' },
  { base: 8, label: 'OCT', prefix: '0o', placeholder: '377' },
];

const VALID_CHARS: Record<NumberBase, RegExp> = {
  2: /^-?[01]+$/,
  8: /^-?[0-7]+$/,
  10: /^-?\d+$/,
  16: /^-?[0-9a-fA-F]+$/,
};

const BASE_PREFIXES: Record<NumberBase, string> = {
  2: '0b',
  8: '0o',
  10: '',
  16: '0x',
};

export interface ConversionResult {
  values: Record<NumberBase, string>;
}

export interface ConversionError {
  error: string;
}

export type NumberResult = ConversionResult | ConversionError;

export function isNumberError(r: NumberResult): r is ConversionError {
  return 'error' in r;
}

/** Parse input in the given base and return representations in all four bases. */
export function convertNumber(input: string, fromBase: NumberBase): NumberResult {
  const trimmed = input.trim();
  if (!trimmed) return { error: 'Enter a number.' };

  if (!VALID_CHARS[fromBase].test(trimmed)) {
    const names: Record<NumberBase, string> = {
      2: 'binary — only 0 and 1 are valid',
      8: 'octal — digits 0–7 only',
      10: 'decimal — digits 0–9 only',
      16: 'hexadecimal — digits 0–9 and A–F only',
    };
    return { error: `Invalid ${names[fromBase]}.` };
  }

  const isNegative = trimmed.startsWith('-');
  const digits = isNegative ? trimmed.slice(1) : trimmed;
  if (!digits) return { error: 'Enter digits after the minus sign.' };

  let value: bigint;
  try {
    const prefix = BASE_PREFIXES[fromBase];
    const abs = BigInt(`${prefix}${digits}`);
    value = isNegative ? -abs : abs;
  } catch {
    return { error: 'Failed to parse number.' };
  }

  return { values: toAllBases(value) };
}

/** Build display strings for all bases from a BigInt value. */
export function toAllBases(value: bigint): Record<NumberBase, string> {
  const sign = value < 0n ? '-' : '';
  const abs = value < 0n ? -value : value;
  return {
    10: value.toString(10),
    16: sign + abs.toString(16),
    2: sign + abs.toString(2),
    8: sign + abs.toString(8),
  };
}

/** Format a value string with its base prefix for copying (e.g. 0xff, 0b1010). */
export function formatWithPrefix(value: string, base: NumberBase): string {
  const prefix = BASE_PREFIXES[base];
  if (!prefix || !value) return value;
  const isNeg = value.startsWith('-');
  return isNeg ? `-${prefix}${value.slice(1)}` : `${prefix}${value}`;
}
