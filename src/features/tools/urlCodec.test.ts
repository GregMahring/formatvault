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

  it('returns empty string for empty input', () => {
    expect(assertOutput(encodeUrl(''))).toBe('');
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

  it('returns empty array for empty string', () => {
    expect(parseQueryString('')).toEqual([]);
  });
});
