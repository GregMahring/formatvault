import { describe, it, expect } from 'vitest';
import { formatToml, validateToml, parseToml, serializeToToml } from './tomlFormatter';

describe('formatToml', () => {
  it('formats valid TOML', () => {
    const result = formatToml('title = "Hello"\nversion = "1.0"');
    expect(result.error).toBeNull();
    expect(result.output).toContain('title');
    expect(result.output).toContain('Hello');
  });

  it('returns error on empty input', () => {
    const result = formatToml('  ');
    expect(result.output).toBeNull();
    expect(result.error).toBe('Input is empty.');
  });

  it('returns error with line number for invalid TOML', () => {
    const result = formatToml('bad [toml');
    expect(result.output).toBeNull();
    expect(result.error).toBeTruthy();
    expect(typeof result.line).toBe('number');
  });

  it('round-trips TOML correctly', () => {
    const input = '[server]\nhost = "localhost"\nport = 8080\nenabled = true';
    const result = formatToml(input);
    expect(result.error).toBeNull();
    const round = formatToml(result.output!);
    expect(round.error).toBeNull();
    expect(round.output).toBe(result.output);
  });

  it('handles nested tables', () => {
    const input = '[database]\nhost = "db"\nport = 5432\n[database.credentials]\nuser = "admin"';
    const result = formatToml(input);
    expect(result.error).toBeNull();
    expect(result.output).toContain('host');
  });

  it('handles arrays', () => {
    const input = 'tags = ["rust", "toml", "config"]';
    const result = formatToml(input);
    expect(result.error).toBeNull();
    expect(result.output).toContain('tags');
  });
});

describe('validateToml', () => {
  it('returns null for valid TOML', () => {
    expect(validateToml('key = "value"')).toBeNull();
  });

  it('returns error for invalid TOML', () => {
    const err = validateToml('bad [toml');
    expect(err).not.toBeNull();
    expect(err?.error).toBeTruthy();
  });

  it('returns error for empty input', () => {
    expect(validateToml('')?.error).toBe('Input is empty.');
  });

  it('returns line number on parse error', () => {
    const err = validateToml('key = "value"\nbad = [unclosed');
    expect(err?.line).toBeDefined();
  });
});

describe('parseToml', () => {
  it('parses TOML to a JS object', () => {
    const { value, error } = parseToml('name = "Bob"\nage = 25');
    expect(error).toBeNull();
    expect(value).toEqual({ name: 'Bob', age: 25 });
  });

  it('returns error on invalid TOML', () => {
    const { error } = parseToml('bad [toml');
    expect(error).toBeTruthy();
  });

  it('returns error on empty input', () => {
    const { error } = parseToml('');
    expect(error).toBe('Input is empty.');
  });
});

describe('serializeToToml', () => {
  it('serializes an object to TOML', () => {
    const output = serializeToToml({ name: 'Bob', age: 25 });
    expect(output).toContain('name');
    expect(output).toContain('Bob');
    expect(output).toContain('age');
  });
});
