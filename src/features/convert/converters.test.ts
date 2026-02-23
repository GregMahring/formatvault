import { describe, it, expect } from 'vitest';
import { jsonToCsv, csvToJson, jsonToYaml, yamlToJson, csvToYaml, yamlToCsv } from './converters';

describe('jsonToCsv', () => {
  it('converts array of objects to CSV', () => {
    const result = jsonToCsv('[{"name":"Alice","age":30},{"name":"Bob","age":25}]');
    expect(result.error).toBeNull();
    expect(result.output).toContain('name,age');
    expect(result.output).toContain('Alice,30');
  });

  it('wraps single object in array', () => {
    const result = jsonToCsv('{"name":"Alice","age":30}');
    expect(result.error).toBeNull();
    expect(result.output).toContain('name,age');
  });

  it('warns on nested objects', () => {
    const result = jsonToCsv('[{"a":{"nested":true}}]');
    expect(result.error).toBeNull();
    expect(result.warning).toBeTruthy();
  });

  it('returns error for invalid JSON', () => {
    expect(jsonToCsv('{bad}')).toMatchObject({ output: null });
  });

  it('returns error for empty input', () => {
    expect(jsonToCsv('')).toMatchObject({ error: 'Input is empty.' });
  });
});

describe('csvToJson', () => {
  it('converts CSV to JSON array', () => {
    const result = csvToJson('name,age\nAlice,30\nBob,25');
    expect(result.error).toBeNull();
    const parsed = JSON.parse(result.output ?? '[]') as unknown[];
    expect(parsed).toHaveLength(2);
    expect((parsed[0] as Record<string, string>).name).toBe('Alice');
  });

  it('returns error for empty input', () => {
    expect(csvToJson('')).toMatchObject({ output: null });
  });
});

describe('jsonToYaml', () => {
  it('converts JSON object to YAML', () => {
    const result = jsonToYaml('{"name":"Alice","age":30}');
    expect(result.error).toBeNull();
    expect(result.output).toContain('name: Alice');
    expect(result.output).toContain('age: 30');
  });

  it('returns error for invalid JSON', () => {
    expect(jsonToYaml('{bad}')).toMatchObject({ output: null });
  });
});

describe('yamlToJson', () => {
  it('converts YAML to JSON', () => {
    const result = yamlToJson('name: Alice\nage: 30');
    expect(result.error).toBeNull();
    const parsed = JSON.parse(result.output ?? '{}') as Record<string, unknown>;
    expect(parsed.name).toBe('Alice');
    expect(parsed.age).toBe(30);
  });

  it('returns error for invalid YAML', () => {
    expect(yamlToJson('key: [unclosed')).toMatchObject({ output: null });
  });
});

describe('csvToYaml', () => {
  it('converts CSV to YAML sequence', () => {
    const result = csvToYaml('name,age\nAlice,30');
    expect(result.error).toBeNull();
    expect(result.output).toContain('name: Alice');
  });
});

describe('yamlToCsv', () => {
  it('converts YAML sequence of mappings to CSV', () => {
    const result = yamlToCsv('- name: Alice\n  age: 30\n- name: Bob\n  age: 25');
    expect(result.error).toBeNull();
    expect(result.output).toContain('name,age');
    expect(result.output).toContain('Alice,30');
  });

  it('warns on nested values', () => {
    const result = yamlToCsv('- name: Alice\n  tags:\n    - a\n    - b');
    expect(result.error).toBeNull();
    expect(result.warning).toBeTruthy();
  });
});
