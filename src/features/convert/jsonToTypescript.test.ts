import { describe, it, expect } from 'vitest';
import { jsonToTypescript } from './jsonToTypescript';

describe('jsonToTypescript', () => {
  // ─── Error cases ─────────────────────────────────────────────────────────

  it('returns error for empty input', () => {
    const r = jsonToTypescript('');
    expect(r.error).toBe('Input is empty.');
    expect(r.output).toBeNull();
  });

  it('returns error for invalid JSON', () => {
    const r = jsonToTypescript('{bad}');
    expect(r.error).toMatch(/Invalid JSON/);
    expect(r.output).toBeNull();
  });

  // ─── Primitives ──────────────────────────────────────────────────────────

  it('handles a string root value', () => {
    const r = jsonToTypescript('"hello"');
    expect(r.error).toBeNull();
    expect(r.output).toBe('export type Root = string;');
  });

  it('handles a number root value', () => {
    const r = jsonToTypescript('42');
    expect(r.error).toBeNull();
    expect(r.output).toBe('export type Root = number;');
  });

  it('handles a boolean root value', () => {
    const r = jsonToTypescript('true');
    expect(r.error).toBeNull();
    expect(r.output).toBe('export type Root = boolean;');
  });

  it('handles a null root value', () => {
    const r = jsonToTypescript('null');
    expect(r.error).toBeNull();
    expect(r.output).toBe('export type Root = null;');
  });

  // ─── Simple objects ──────────────────────────────────────────────────────

  it('generates an interface for a flat object', () => {
    const r = jsonToTypescript('{"name": "Alice", "age": 30, "active": true}');
    expect(r.error).toBeNull();
    expect(r.output).toContain('export interface Root {');
    expect(r.output).toContain('name: string;');
    expect(r.output).toContain('age: number;');
    expect(r.output).toContain('active: boolean;');
  });

  it('handles null fields in objects', () => {
    const r = jsonToTypescript('{"value": null}');
    expect(r.error).toBeNull();
    expect(r.output).toContain('value: null;');
  });

  // ─── Nested objects ──────────────────────────────────────────────────────

  it('generates separate interfaces for nested objects', () => {
    const r = jsonToTypescript('{"user": {"name": "Bob", "address": {"city": "NYC"}}}');
    expect(r.error).toBeNull();
    // Should have interfaces for nested objects
    expect(r.output).toContain('interface Root {');
    expect(r.output).toContain('user: RootUser;');
    expect(r.output).toContain('interface RootUser {');
    expect(r.output).toContain('address: RootUserAddress;');
    expect(r.output).toContain('interface RootUserAddress {');
    expect(r.output).toContain('city: string;');
  });

  // ─── Arrays ──────────────────────────────────────────────────────────────

  it('handles an empty array', () => {
    const r = jsonToTypescript('[]');
    expect(r.error).toBeNull();
    expect(r.output).toBe('export type Root = unknown[];');
  });

  it('handles array of primitives', () => {
    const r = jsonToTypescript('[1, 2, 3]');
    expect(r.error).toBeNull();
    expect(r.output).toBe('export type Root = number[];');
  });

  it('handles mixed-type arrays', () => {
    const r = jsonToTypescript('["hello", 42, true]');
    expect(r.error).toBeNull();
    expect(r.output).toContain('(string | number | boolean)[]');
  });

  it('handles array of objects', () => {
    const r = jsonToTypescript('[{"id": 1, "name": "A"}, {"id": 2, "name": "B"}]');
    expect(r.error).toBeNull();
    expect(r.output).toContain('interface RootItem {');
    expect(r.output).toContain('id: number;');
    expect(r.output).toContain('name: string;');
    expect(r.output).toContain('type Root = RootItem[];');
  });

  // ─── Optional fields ────────────────────────────────────────────────────

  it('marks fields as optional when not present in all array elements', () => {
    const input = JSON.stringify([
      { id: 1, name: 'A', email: 'a@b.com' },
      { id: 2, name: 'B' },
    ]);
    const r = jsonToTypescript(input);
    expect(r.error).toBeNull();
    expect(r.output).toContain('id: number;');
    expect(r.output).toContain('name: string;');
    expect(r.output).toContain('email?: string;');
  });

  // ─── Options ─────────────────────────────────────────────────────────────

  it('respects rootName option', () => {
    const r = jsonToTypescript('{"x": 1}', { rootName: 'MyData' });
    expect(r.error).toBeNull();
    expect(r.output).toContain('interface MyData {');
  });

  it('respects style: "type" option', () => {
    const r = jsonToTypescript('{"x": 1}', { style: 'type' });
    expect(r.error).toBeNull();
    expect(r.output).toContain('export type Root = {');
    expect(r.output).toContain('};');
  });

  it('respects allOptional option', () => {
    const r = jsonToTypescript('{"name": "A", "age": 30}', { allOptional: true });
    expect(r.error).toBeNull();
    expect(r.output).toContain('name?: string;');
    expect(r.output).toContain('age?: number;');
  });

  it('respects exportTypes: false', () => {
    const r = jsonToTypescript('{"x": 1}', { exportTypes: false });
    expect(r.error).toBeNull();
    expect(r.output).not.toContain('export ');
    expect(r.output).toContain('interface Root {');
  });

  // ─── Special keys ───────────────────────────────────────────────────────

  it('quotes keys that are not valid JS identifiers', () => {
    const r = jsonToTypescript('{"foo-bar": 1, "with spaces": 2, "normal": 3}');
    expect(r.error).toBeNull();
    expect(r.output).toContain('"foo-bar": number;');
    expect(r.output).toContain('"with spaces": number;');
    expect(r.output).toContain('normal: number;');
  });

  // ─── Empty object ───────────────────────────────────────────────────────

  it('handles an empty object', () => {
    const r = jsonToTypescript('{}');
    expect(r.error).toBeNull();
    expect(r.output).toContain('interface Root {');
    expect(r.output).toContain('}');
  });

  // ─── Deep nesting ───────────────────────────────────────────────────────

  it('handles deeply nested structures', () => {
    const input = JSON.stringify({ a: { b: { c: { d: { e: 'deep' } } } } });
    const r = jsonToTypescript(input);
    expect(r.error).toBeNull();
    expect(r.output).toContain('e: string;');
  });
});
