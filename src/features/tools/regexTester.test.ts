import { describe, it, expect } from 'vitest';
import {
  testRegex,
  highlightMatches,
  buildFlagString,
  DEFAULT_FLAGS,
  type RegexFlags,
} from './regexTester';

// Helper to produce flags with overrides
function flags(overrides: Partial<RegexFlags> = {}): RegexFlags {
  return { ...DEFAULT_FLAGS, ...overrides };
}

describe('buildFlagString', () => {
  it('returns "g" for default flags', () => {
    expect(buildFlagString(DEFAULT_FLAGS)).toBe('g');
  });

  it('includes only active flags', () => {
    const f = flags({ global: true, ignoreCase: true, multiline: true, dotAll: true });
    expect(buildFlagString(f)).toBe('gims');
  });

  it('returns empty string when all flags off', () => {
    const f = flags({ global: false });
    expect(buildFlagString(f)).toBe('');
  });
});

describe('testRegex', () => {
  it('returns empty matches for empty pattern', () => {
    const result = testRegex('', DEFAULT_FLAGS, 'hello world');
    expect(result.error).toBeNull();
    expect(result.matches).toEqual([]);
  });

  it('returns error for invalid pattern', () => {
    const result = testRegex('[unclosed', DEFAULT_FLAGS, 'test');
    expect(result.matches).toBeNull();
    expect(typeof result.error).toBe('string');
    expect(result.error!.length).toBeGreaterThan(0);
  });

  it('finds multiple matches with global flag', () => {
    const result = testRegex('\\w+', DEFAULT_FLAGS, 'hello world');
    expect(result.error).toBeNull();
    expect(result.matches).not.toBeNull();
    expect(result.matches!.length).toBe(2);
    expect(result.matches![0]!.value).toBe('hello');
    expect(result.matches![0]!.index).toBe(0);
    expect(result.matches![0]!.end).toBe(5);
    expect(result.matches![1]!.value).toBe('world');
    expect(result.matches![1]!.index).toBe(6);
    expect(result.matches![1]!.end).toBe(11);
  });

  it('finds only first match without global flag', () => {
    const result = testRegex('\\w+', flags({ global: false }), 'hello world');
    expect(result.error).toBeNull();
    expect(result.matches!.length).toBe(1);
    expect(result.matches![0]!.value).toBe('hello');
  });

  it('applies case-insensitive flag', () => {
    const result = testRegex('[A-Z]+', flags({ ignoreCase: true }), 'Hello World');
    expect(result.error).toBeNull();
    expect(result.matches!.length).toBe(2);
    expect(result.matches![0]!.value).toBe('Hello');
    expect(result.matches![1]!.value).toBe('World');
  });

  it('applies multiline flag for ^ and $', () => {
    const result = testRegex('^\\w+', flags({ multiline: true }), 'foo\nbar\nbaz');
    expect(result.error).toBeNull();
    expect(result.matches!.length).toBe(3);
    expect(result.matches!.map((m) => m.value)).toEqual(['foo', 'bar', 'baz']);
  });

  it('captures numbered groups', () => {
    const result = testRegex('(\\w+)', DEFAULT_FLAGS, 'hello world');
    expect(result.error).toBeNull();
    expect(result.matches!.length).toBe(2);
    expect(result.matches![0]!.groups).toEqual(['hello']);
    expect(result.matches![1]!.groups).toEqual(['world']);
  });

  it('captures named groups', () => {
    const result = testRegex('(?<word>\\w+)', DEFAULT_FLAGS, 'hello world');
    expect(result.error).toBeNull();
    expect(result.matches!.length).toBe(2);
    expect(result.matches![0]!.namedGroups).toEqual({ word: 'hello' });
    expect(result.matches![1]!.namedGroups).toEqual({ word: 'world' });
  });

  it('returns null namedGroups when no named groups', () => {
    const result = testRegex('(\\w+)', DEFAULT_FLAGS, 'hello');
    expect(result.matches![0]!.namedGroups).toBeNull();
  });

  it('handles zero-length match pattern without infinite loop', () => {
    // a* can match the empty string at every position — matchAll must terminate
    const result = testRegex('a*', DEFAULT_FLAGS, 'aab');
    expect(result.error).toBeNull();
    // Just verify it terminates and returns some matches
    expect(Array.isArray(result.matches)).toBe(true);
  });

  it('caps results at 1000 matches', () => {
    // Pattern "." with a 2000-char string should be capped at 1000
    const longInput = 'a'.repeat(2000);
    const result = testRegex('.', DEFAULT_FLAGS, longInput);
    expect(result.error).toBeNull();
    expect(result.matches!.length).toBe(1000);
  });
});

describe('highlightMatches', () => {
  it('returns HTML-escaped input when there are no matches', () => {
    const result = highlightMatches('hello & world', []);
    expect(result).toBe('hello &amp; world');
  });

  it('wraps matches in <mark> tags', () => {
    const matches = [{ index: 0, end: 5, value: 'hello', groups: [], namedGroups: null }];
    const result = highlightMatches('hello world', matches);
    expect(result).toBe('<mark>hello</mark> world');
  });

  it('HTML-escapes content inside <mark> tags', () => {
    const matches = [{ index: 0, end: 7, value: '<match>', groups: [], namedGroups: null }];
    const result = highlightMatches('<match>', matches);
    expect(result).toBe('<mark>&lt;match&gt;</mark>');
  });

  it('HTML-escapes <script> tags in plain text — XSS safe', () => {
    const result = highlightMatches('<script>alert(1)</script>', []);
    expect(result).not.toContain('<script>');
    expect(result).toContain('&lt;script&gt;');
  });

  it('handles multiple non-overlapping matches', () => {
    const matches = [
      { index: 0, end: 5, value: 'hello', groups: [], namedGroups: null },
      { index: 6, end: 11, value: 'world', groups: [], namedGroups: null },
    ];
    const result = highlightMatches('hello world', matches);
    expect(result).toBe('<mark>hello</mark> <mark>world</mark>');
  });

  it('skips overlapping matches', () => {
    const matches = [
      { index: 0, end: 5, value: 'hello', groups: [], namedGroups: null },
      { index: 2, end: 7, value: 'llo w', groups: [], namedGroups: null }, // overlaps
    ];
    const result = highlightMatches('hello world', matches);
    // Second match is skipped; remaining text after first match is plain
    expect(result).toBe('<mark>hello</mark> world');
  });

  it('handles match at the end of input', () => {
    const matches = [{ index: 6, end: 11, value: 'world', groups: [], namedGroups: null }];
    const result = highlightMatches('hello world', matches);
    expect(result).toBe('hello <mark>world</mark>');
  });
});
