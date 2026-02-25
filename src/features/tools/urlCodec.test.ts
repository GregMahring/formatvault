import { describe, it, expect } from 'vitest';
import { encodeUrl, decodeUrl, looksLikeEncoded, parseQueryString, isUrlError } from './urlCodec';

function assertOutput(result: ReturnType<typeof encodeUrl>) {
  if (isUrlError(result)) throw new Error(`Expected success but got error: ${result.error}`);
  return result.output;
}

describe('encodeUrl (component)', () => {
  it('encodes special characters', () => {
    expect(assertOutput(encodeUrl('hello world & foo=bar'))).toBe(
      'hello%20world%20%26%20foo%3Dbar'
    );
  });

  it('encodes Unicode characters', () => {
    expect(assertOutput(encodeUrl('café'))).toBe('caf%C3%A9');
  });

  it('encodes emoji', () => {
    const encoded = assertOutput(encodeUrl('👋'));
    expect(encoded).toBe('%F0%9F%91%8B');
  });

  it('returns empty string for empty input', () => {
    expect(assertOutput(encodeUrl(''))).toBe('');
  });
});

describe('encodeUrl (full URL mode)', () => {
  it('encodes spaces in query values while preserving ? and & delimiters', () => {
    // full mode splits on [?&#=+] and encodes each segment; ? & = are preserved as-is
    const result = assertOutput(encodeUrl('?q=hello world&lang=en', 'full'));
    expect(result).toContain('hello%20world');
    expect(result).toContain('?');
    expect(result).toContain('&');
    expect(result).toContain('=');
  });

  it('preserves query string delimiters', () => {
    const result = assertOutput(encodeUrl('a=1&b=hello world', 'full'));
    expect(result).toContain('&');
    expect(result).toContain('hello%20world');
  });
});

describe('decodeUrl', () => {
  it('decodes percent-encoded string', () => {
    expect(assertOutput(decodeUrl('hello%20world%20%26%20foo%3Dbar'))).toBe(
      'hello world & foo=bar'
    );
  });

  it('decodes Unicode percent-encoded', () => {
    expect(assertOutput(decodeUrl('caf%C3%A9'))).toBe('café');
  });

  it('returns error for invalid percent sequence', () => {
    const result = decodeUrl('%GG');
    expect(isUrlError(result)).toBe(true);
  });

  it('returns error for bare percent sign', () => {
    const result = decodeUrl('100%');
    expect(isUrlError(result)).toBe(true);
  });

  it('returns empty string for empty input', () => {
    expect(assertOutput(decodeUrl(''))).toBe('');
  });
});

describe('looksLikeEncoded', () => {
  it('detects percent-encoded strings', () => {
    expect(looksLikeEncoded('hello%20world')).toBe(true);
    expect(looksLikeEncoded('foo%3Dbar')).toBe(true);
  });

  it('returns false for plain strings', () => {
    expect(looksLikeEncoded('hello world')).toBe(false);
    expect(looksLikeEncoded('normal text')).toBe(false);
  });

  it('is case-insensitive for hex digits', () => {
    expect(looksLikeEncoded('hello%2fworld')).toBe(true); // lowercase hex
    expect(looksLikeEncoded('hello%2Fworld')).toBe(true); // uppercase hex
  });
});

describe('parseQueryString', () => {
  it('parses key=value pairs', () => {
    expect(parseQueryString('foo=bar&baz=qux')).toEqual([
      { key: 'foo', value: 'bar' },
      { key: 'baz', value: 'qux' },
    ]);
  });

  it('handles leading ?', () => {
    expect(parseQueryString('?foo=bar')[0]).toEqual({ key: 'foo', value: 'bar' });
  });

  it('decodes percent-encoded keys and values', () => {
    expect(parseQueryString('hello%20world=caf%C3%A9')[0]).toEqual({
      key: 'hello world',
      value: 'café',
    });
  });

  it('handles value-less keys (flag params)', () => {
    expect(parseQueryString('debug&verbose')).toEqual([
      { key: 'debug', value: '' },
      { key: 'verbose', value: '' },
    ]);
  });

  it('handles empty values (key= with no value)', () => {
    expect(parseQueryString('name=')).toEqual([{ key: 'name', value: '' }]);
  });

  it('does not throw on malformed percent sequences — returns raw value', () => {
    // %GG is invalid — safeDecodeComponent should return it unchanged
    expect(() => parseQueryString('bad=%GG')).not.toThrow();
    const result = parseQueryString('bad=%GG');
    expect(result[0]?.key).toBe('bad');
    expect(result[0]?.value).toBe('%GG'); // raw, not decoded
  });

  it('returns empty array for empty string', () => {
    expect(parseQueryString('')).toEqual([]);
  });

  it('returns empty array for whitespace-only string', () => {
    expect(parseQueryString('   ')).toEqual([]);
  });
});
