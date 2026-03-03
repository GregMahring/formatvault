import { describe, it, expect } from 'vitest';
import { generateJsonSchema, validateJsonAgainstSchema } from './jsonSchema';

describe('generateJsonSchema', () => {
  it('returns error for empty input', async () => {
    const r = await generateJsonSchema('');
    expect(r.error).toBe('Input is empty.');
    expect(r.output).toBeNull();
  });

  it('returns error for invalid JSON', async () => {
    const r = await generateJsonSchema('{bad}');
    expect(r.error).toMatch(/Invalid JSON/);
    expect(r.output).toBeNull();
  });

  it('generates schema for a simple object', async () => {
    const r = await generateJsonSchema('{"name": "Alice", "age": 30}');
    expect(r.error).toBeNull();
    expect(r.output).not.toBeNull();

    const schema = JSON.parse(r.output!) as Record<string, unknown>;
    expect(schema.type).toBe('object');
    expect(schema.$schema).toBe('http://json-schema.org/draft-07/schema#');

    const props = schema.properties as Record<string, Record<string, unknown>>;
    expect(props.name!.type).toBe('string');
    expect(props.age!.type).toBe('integer');
  });

  it('generates schema for an array', async () => {
    const r = await generateJsonSchema('[1, 2, 3]');
    expect(r.error).toBeNull();
    const schema = JSON.parse(r.output!) as Record<string, unknown>;
    expect(schema.type).toBe('array');
  });

  it('generates schema for nested objects', async () => {
    const r = await generateJsonSchema('{"user": {"name": "Bob"}}');
    expect(r.error).toBeNull();
    const schema = JSON.parse(r.output!) as Record<string, unknown>;
    const props = schema.properties as Record<string, Record<string, unknown>>;
    expect(props.user!.type).toBe('object');
  });

  it('includes required fields by default', async () => {
    const r = await generateJsonSchema('{"name": "Alice"}');
    expect(r.error).toBeNull();
    const schema = JSON.parse(r.output!) as Record<string, unknown>;
    // to-json-schema may use boolean `required: true` or an array format
    expect(schema.required).toBeDefined();
  });

  it('respects required: false option', async () => {
    const r = await generateJsonSchema('{"name": "Alice"}', { required: false });
    expect(r.error).toBeNull();
    const schema = JSON.parse(r.output!) as Record<string, unknown>;
    expect(schema.required).toBeUndefined();
  });

  it('generates schema for a string primitive', async () => {
    const r = await generateJsonSchema('"hello"');
    expect(r.error).toBeNull();
    const schema = JSON.parse(r.output!) as Record<string, unknown>;
    expect(schema.type).toBe('string');
  });
});

describe('validateJsonAgainstSchema', () => {
  const simpleSchema = JSON.stringify({
    type: 'object',
    properties: {
      name: { type: 'string' },
      age: { type: 'number' },
    },
    required: ['name'],
  });

  it('returns error for empty JSON input', async () => {
    const r = await validateJsonAgainstSchema('', simpleSchema);
    expect(r.error).toBe('JSON input is empty.');
  });

  it('returns error for empty schema input', async () => {
    const r = await validateJsonAgainstSchema('{"name": "A"}', '');
    expect(r.error).toBe('Schema input is empty.');
  });

  it('returns error for invalid JSON data', async () => {
    const r = await validateJsonAgainstSchema('{bad}', simpleSchema);
    expect(r.error).toMatch(/Invalid JSON data/);
  });

  it('returns error for invalid schema', async () => {
    const r = await validateJsonAgainstSchema('{"name": "A"}', '{bad}');
    expect(r.error).toMatch(/Invalid JSON Schema/);
  });

  it('validates valid data successfully', async () => {
    const r = await validateJsonAgainstSchema('{"name": "Alice", "age": 30}', simpleSchema);
    expect(r.error).toBeNull();
    expect(r.result).not.toBeNull();
    expect(r.result!.valid).toBe(true);
    expect(r.result!.errors).toHaveLength(0);
  });

  it('returns errors for invalid data', async () => {
    const r = await validateJsonAgainstSchema('{"age": "not a number"}', simpleSchema);
    expect(r.error).toBeNull();
    expect(r.result).not.toBeNull();
    expect(r.result!.valid).toBe(false);
    expect(r.result!.errors.length).toBeGreaterThan(0);
  });

  it('reports missing required fields', async () => {
    const r = await validateJsonAgainstSchema('{"age": 30}', simpleSchema);
    expect(r.error).toBeNull();
    expect(r.result!.valid).toBe(false);
    const requiredError = r.result!.errors.find((e) => e.keyword === 'required');
    expect(requiredError).toBeDefined();
  });

  it('reports type mismatch errors with path', async () => {
    const r = await validateJsonAgainstSchema('{"name": "A", "age": "old"}', simpleSchema);
    expect(r.error).toBeNull();
    expect(r.result!.valid).toBe(false);
    const typeError = r.result!.errors.find((e) => e.keyword === 'type');
    expect(typeError).toBeDefined();
    expect(typeError!.path).toBe('/age');
  });
});
