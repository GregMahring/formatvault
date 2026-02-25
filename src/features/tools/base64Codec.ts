/**
 * Base64 encode/decode utilities.
 * Uses `js-base64` for Unicode-safe encoding (native btoa fails on non-ASCII).
 */
import { fromBase64, toBase64 } from 'js-base64';

export type Base64Mode = 'encode' | 'decode';

export interface Base64Result {
  output: string;
  error: null;
}

export interface Base64Error {
  output: null;
  error: string;
}

export type Base64CodecResult = Base64Result | Base64Error;

export function isBase64Error(r: Base64CodecResult): r is Base64Error {
  return r.error !== null;
}

/** Encode a plain text string to Base64 (Unicode-safe). */
export function encodeBase64(input: string): Base64CodecResult {
  if (!input) return { output: '', error: null };
  try {
    return { output: toBase64(input), error: null };
  } catch (err) {
    return { output: null, error: err instanceof Error ? err.message : 'Encoding failed.' };
  }
}

/** Decode a Base64 string to plain text (Unicode-safe). */
export function decodeBase64(input: string): Base64CodecResult {
  if (!input) return { output: '', error: null };
  // Strip whitespace — users often paste Base64 with line breaks
  const cleaned = input.replace(/\s/g, '');
  try {
    const decoded = fromBase64(cleaned);
    return { output: decoded, error: null };
  } catch (err) {
    return { output: null, error: err instanceof Error ? err.message : 'Invalid Base64 input.' };
  }
}

/**
 * Detect whether a string looks like Base64 (to auto-select decode mode).
 * Not authoritative — just a heuristic for UX convenience.
 *
 * Accepts both padded (`SGVsbG8=`) and unpadded (`SGVsbG8`) Base64, and
 * URL-safe Base64 (`-_` instead of `+/`). Minimum length of 4 avoids
 * false-positives on very short plain-text strings like "AAAA".
 */
export function looksLikeBase64(input: string): boolean {
  const cleaned = input.trim().replace(/\s/g, '');
  if (cleaned.length < 4) return false;
  // Match standard or URL-safe Base64, with optional padding
  // Length % 4 is checked after stripping trailing = to allow unpadded
  if (!/^[A-Za-z0-9+/\-_]+=*$/.test(cleaned)) return false;
  const withoutPadding = cleaned.replace(/=+$/, '');
  // A valid Base64 stream's raw length mod 4 must be 0, 2, or 3 (1 is impossible)
  return withoutPadding.length % 4 !== 1;
}
