import { describe, it, expect } from 'vitest';
import { formatJson, minifyJson, validateJson } from './jsonFormatter';

const OPTS = { indent: 2 as const, sortKeys: false, relaxed: false };

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
});
