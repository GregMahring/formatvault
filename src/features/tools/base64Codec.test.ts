import { describe, it, expect } from 'vitest';
import { encodeBase64, decodeBase64, looksLikeBase64, isBase64Error } from './base64Codec';

function assertOutput(result: ReturnType<typeof encodeBase64>) {
  if (isBase64Error(result)) throw new Error(`Expected success but got error: ${result.error}`);
  return result.output;
}

describe('encodeBase64', () => {
  it('encodes ASCII text', () => {
    expect(assertOutput(encodeBase64('Hello, World!'))).toBe('SGVsbG8sIFdvcmxkIQ==');
  });

  it('encodes Unicode text (emoji)', () => {
    expect(assertOutput(encodeBase64('Hello 🌍')).length).toBeGreaterThan(0);
  });

  it('encodes multi-byte CJK characters', () => {
    const encoded = assertOutput(encodeBase64('中文'));
    expect(encoded.length).toBeGreaterThan(0);
    // Must round-trip cleanly
    expect(assertOutput(decodeBase64(encoded))).toBe('中文');
  });

  it('returns empty string for empty input', () => {
    expect(assertOutput(encodeBase64(''))).toBe('');
  });
});

describe('decodeBase64', () => {
  it('decodes standard Base64', () => {
    expect(assertOutput(decodeBase64('SGVsbG8sIFdvcmxkIQ=='))).toBe('Hello, World!');
  });

  it('decodes Base64 with embedded whitespace/newlines', () => {
    expect(assertOutput(decodeBase64('SGVs\nbG8s\nIFdv\ncmxk\nIQ=='))).toBe('Hello, World!');
  });

  it('decodes unpadded Base64 (no trailing =)', () => {
    // 'Hello' → SGVsbG8= (padded) but SGVsbG8 (unpadded) must also work
    expect(assertOutput(decodeBase64('SGVsbG8'))).toBe('Hello');
  });

  it('round-trips Unicode via encode then decode', () => {
    const encoded = assertOutput(encodeBase64('Hello 🌍'));
    expect(assertOutput(decodeBase64(encoded))).toBe('Hello 🌍');
  });

  it('returns empty string for empty input', () => {
    expect(assertOutput(decodeBase64(''))).toBe('');
  });

  it('handles binary (non-UTF-8) Base64 without throwing — js-base64 substitutes replacement chars', () => {
    // \xFF\xFE is a UTF-16 BOM — not valid UTF-8 — js-base64 substitutes U+FFFD
    const binaryBase64 = btoa('\xFF\xFE');
    const result = decodeBase64(binaryBase64);
    // Must not throw and must not be an error
    expect(isBase64Error(result)).toBe(false);
    // U+FFFD replacement character expected in output when decoding non-UTF-8 bytes
    expect(assertOutput(result)).toContain('\uFFFD');
  });

  it('handles invalid Base64 without throwing', () => {
    // just ensure no uncaught exception propagates
    const result = decodeBase64('not!!valid%%base64');
    expect(result).toBeDefined();
  });
});

describe('looksLikeBase64', () => {
  it('detects padded Base64 strings', () => {
    expect(looksLikeBase64('SGVsbG8sIFdvcmxkIQ==')).toBe(true);
    expect(looksLikeBase64('dGVzdA==')).toBe(true);
  });

  it('detects unpadded Base64 strings', () => {
    // 'Hello' base64 without padding
    expect(looksLikeBase64('SGVsbG8')).toBe(true);
    // 6-char unpadded (valid — length % 4 === 2)
    expect(looksLikeBase64('SGVsbA')).toBe(true);
  });

  it('rejects Base64 with invalid length remainder (length % 4 === 1)', () => {
    // A single-char leftover after stripping padding is never valid Base64
    expect(looksLikeBase64('SGVS')).toBe(true); // 4 chars — valid
    expect(looksLikeBase64('SGVSA')).toBe(false); // 5 chars (% 4 = 1) — invalid
  });

  it('returns false for plain text', () => {
    expect(looksLikeBase64('Hello, World!')).toBe(false);
    expect(looksLikeBase64('{"json": true}')).toBe(false);
  });

  it('returns false for strings shorter than 4 chars', () => {
    expect(looksLikeBase64('AB')).toBe(false);
    expect(looksLikeBase64('')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(looksLikeBase64('')).toBe(false);
  });
});
