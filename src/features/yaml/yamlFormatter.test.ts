import { describe, it, expect } from 'vitest';
import { formatYaml, validateYaml, parseYaml, serializeToYaml } from './yamlFormatter';

describe('formatYaml', () => {
  it('formats valid YAML', () => {
    const result = formatYaml('name: Alice\nage: 30', { indent: 2 });
    expect(result.error).toBeNull();
    expect(result.output).toContain('name: Alice');
    expect(result.documentCount).toBe(1);
  });

  it('returns error on empty input', () => {
    const result = formatYaml('  ', { indent: 2 });
    expect(result.output).toBeNull();
    expect(result.error).toBe('Input is empty.');
  });

  it('handles multi-document YAML', () => {
    const input = 'a: 1\n---\nb: 2';
    const result = formatYaml(input, { indent: 2 });
    expect(result.error).toBeNull();
    expect(result.documentCount).toBe(2);
    expect(result.output).toContain('---');
  });

  it('returns error with line number for invalid YAML', () => {
    const result = formatYaml('key: [unclosed', { indent: 2 });
    expect(result.output).toBeNull();
    expect(result.error).toBeTruthy();
  });

  it('respects indent size', () => {
    const result = formatYaml('parent:\n  child: 1', { indent: 4 });
    expect(result.error).toBeNull();
    expect(result.output).toContain('    child: 1');
  });
});

describe('validateYaml', () => {
  it('returns null for valid YAML', () => {
    expect(validateYaml('key: value')).toBeNull();
  });

  it('returns error for invalid YAML', () => {
    const err = validateYaml(': invalid: yaml: here:');
    expect(err).not.toBeNull();
  });

  it('returns error for empty input', () => {
    expect(validateYaml('')?.error).toBe('Input is empty.');
  });
});

describe('parseYaml', () => {
  it('parses YAML to a JS object', () => {
    const { value, error } = parseYaml('name: Bob\nage: 25');
    expect(error).toBeNull();
    expect(value).toEqual({ name: 'Bob', age: 25 });
  });
});

describe('serializeToYaml', () => {
  it('serializes an object to YAML', () => {
    const output = serializeToYaml({ name: 'Bob', age: 25 });
    expect(output).toContain('name: Bob');
    expect(output).toContain('age: 25');
  });
});
