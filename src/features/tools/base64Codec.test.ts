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

  it('round-trips Unicode via encode then decode', () => {
    const encoded = assertOutput(encodeBase64('Hello 🌍'));
    expect(assertOutput(decodeBase64(encoded))).toBe('Hello 🌍');
  });

  it('returns empty string for empty input', () => {
    expect(assertOutput(decodeBase64(''))).toBe('');
  });

  it('handles invalid Base64 without throwing', () => {
    // js-base64 is lenient — just ensure no exception is thrown
    const result = decodeBase64('not!!valid%%base64');
    expect(result).toBeDefined();
  });
});

describe('looksLikeBase64', () => {
  it('detects valid Base64 strings', () => {
    expect(looksLikeBase64('SGVsbG8sIFdvcmxkIQ==')).toBe(true);
    expect(looksLikeBase64('dGVzdA==')).toBe(true);
  });

  it('returns false for plain text', () => {
    expect(looksLikeBase64('Hello, World!')).toBe(false);
    expect(looksLikeBase64('{"json": true}')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(looksLikeBase64('')).toBe(false);
  });
});
