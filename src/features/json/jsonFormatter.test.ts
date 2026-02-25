import { describe, it, expect } from 'vitest';
import { formatJson, minifyJson, validateJson, normaliseCurlyQuotes } from './jsonFormatter';

const OPTS = { indent: 2 as const, sortKeys: false, relaxed: false };

describe('normaliseCurlyQuotes', () => {
  it('converts left/right double curly quotes', () => {
    const { normalised, changed } = normaliseCurlyQuotes('\u201chello\u201d');
    expect(normalised).toBe('"hello"');
    expect(changed).toBe(true);
  });

  it('converts left/right single curly quotes', () => {
    const { normalised, changed } = normaliseCurlyQuotes('\u2018hello\u2019');
    expect(normalised).toBe("'hello'");
    expect(changed).toBe(true);
  });

  it('leaves straight quotes unchanged', () => {
    const { normalised, changed } = normaliseCurlyQuotes('"hello"');
    expect(normalised).toBe('"hello"');
    expect(changed).toBe(false);
  });

  it('returns changed: false for plain text with no quotes', () => {
    const { changed } = normaliseCurlyQuotes('hello world');
    expect(changed).toBe(false);
  });
});

describe('formatJson', () => {
  it('pretty-prints valid JSON', () => {
    const result = formatJson('{"b":1,"a":2}', OPTS);
    expect(result.error).toBeNull();
    expect(result.output).toBe('{\n  "b": 1,\n  "a": 2\n}');
  });

  it('sorts keys when sortKeys: true', () => {
    const result = formatJson('{"b":1,"a":2}', { ...OPTS, sortKeys: true });
    expect(result.error).toBeNull();
    expect(result.output).toBe('{\n  "a": 2,\n  "b": 1\n}');
  });

  it('respects indent size', () => {
    const result = formatJson('{"a":1}', { ...OPTS, indent: 4 });
    expect(result.output).toBe('{\n    "a": 1\n}');
  });

  it('returns error on invalid JSON', () => {
    const result = formatJson('{invalid}', OPTS);
    expect(result.output).toBeNull();
    expect(result.error).toBeTruthy();
  });

  it('returns error on empty input', () => {
    const result = formatJson('  ', OPTS);
    expect(result.output).toBeNull();
    expect(result.error).toBe('Input is empty.');
  });

  it('parses relaxed JSON5 with trailing commas', () => {
    const result = formatJson('{"a": 1,}', { ...OPTS, relaxed: true });
    expect(result.error).toBeNull();
    expect(result.output).toBe('{\n  "a": 1\n}');
  });

  it('parses JSON5 with comments', () => {
    const result = formatJson('// comment\n{"a": 1}', { ...OPTS, relaxed: true });
    expect(result.error).toBeNull();
    expect(result.output).toBe('{\n  "a": 1\n}');
  });

  it('rejects trailing commas in strict mode', () => {
    const result = formatJson('{"a": 1,}', OPTS);
    expect(result.output).toBeNull();
    expect(result.error).toBeTruthy();
  });

  it('auto-normalises curly/smart quotes pasted from word processors', () => {
    // macOS autocorrect and Word replace " with \u201c\u201d
    const result = formatJson('{\u201ckey\u201d: \u201cvalue\u201d}', OPTS);
    expect(result.error).toBeNull();
    expect(result.output).toContain('"key"');
    expect((result as { normalisedQuotes?: true }).normalisedQuotes).toBe(true);
  });

  it('does not set normalisedQuotes when input has straight quotes', () => {
    const result = formatJson('{"key":"value"}', OPTS);
    expect(result.error).toBeNull();
    expect((result as { normalisedQuotes?: true }).normalisedQuotes).toBeUndefined();
  });

  it('handles deeply nested objects without stack overflow', () => {
    // Build 50 levels of nesting — well within JS recursion limits
    let obj = '{"a":1}';
    for (let i = 0; i < 50; i++) obj = `{"x":${obj}}`;
    const result = formatJson(obj, OPTS);
    expect(result.error).toBeNull();
  });

  it('handles arrays at root level', () => {
    const result = formatJson('[1,"two",true,null]', OPTS);
    expect(result.error).toBeNull();
    expect(result.output).toContain('"two"');
  });

  it('handles primitive root values (number, string, bool)', () => {
    expect(formatJson('42', OPTS).output).toBe('42');
    expect(formatJson('"hello"', OPTS).output).toBe('"hello"');
    expect(formatJson('true', OPTS).output).toBe('true');
    expect(formatJson('null', OPTS).output).toBe('null');
  });

  it('handles Unicode keys and values', () => {
    const result = formatJson('{"emoji":"🎉","cjk":"中文"}', OPTS);
    expect(result.error).toBeNull();
    expect(result.output).toContain('🎉');
    expect(result.output).toContain('中文');
  });
});

describe('minifyJson', () => {
  it('minifies pretty-printed JSON', () => {
    const result = minifyJson('{\n  "a": 1,\n  "b": 2\n}');
    expect(result.output).toBe('{"a":1,"b":2}');
    expect(result.error).toBeNull();
  });

  it('returns error on invalid JSON', () => {
    const result = minifyJson('{bad}');
    expect(result.output).toBeNull();
    expect(result.error).toBeTruthy();
  });

  it('normalises curly quotes before minifying', () => {
    const result = minifyJson('{\u201ca\u201d:1}');
    expect(result.error).toBeNull();
    expect(result.output).toBe('{"a":1}');
    expect((result as { normalisedQuotes?: true }).normalisedQuotes).toBe(true);
  });
});

describe('validateJson', () => {
  it('returns null for valid JSON', () => {
    expect(validateJson('{"ok":true}')).toBeNull();
  });

  it('returns error for invalid JSON', () => {
    const err = validateJson('{nope}');
    expect(err).not.toBeNull();
    expect(err?.error).toBeTruthy();
  });

  it('returns null for valid JSON5 in relaxed mode', () => {
    expect(validateJson('{a: 1,}', true)).toBeNull();
  });

  it('accepts JSON with curly quotes via normalisation', () => {
    // validateJson should succeed because quotes are normalised first
    expect(validateJson('{\u201cok\u201d:true}')).toBeNull();
  });
});
