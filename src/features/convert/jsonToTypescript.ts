/**
 * JSON → TypeScript type/interface generation.
 *
 * Custom implementation — no external library needed. Walks a parsed JSON
 * value recursively, infers TypeScript types, and emits interface or type
 * alias declarations.
 */

import type { ConversionResult } from './converters';

export interface TypeGenOptions {
  /** Root interface name (default "Root") */
  rootName?: string;
  /** Emit `interface` or `type` keyword (default "interface") */
  style?: 'interface' | 'type';
  /** Mark every property as optional (default false) */
  allOptional?: boolean;
  /** Prefix each declaration with `export` (default true) */
  exportTypes?: boolean;
}

// ─── Internal helpers ────────────────────────────────────────────────────────

/** PascalCase a string: "foo_bar" → "FooBar", "some-thing" → "SomeThing" */
function toPascalCase(s: string): string {
  return s
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, c: string) => c.toUpperCase())
    .replace(/^[a-z]/, (c) => c.toUpperCase());
}

/** Returns true when the key is a valid JS identifier and can be unquoted. */
function isSafeKey(key: string): boolean {
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key);
}

function indent(depth: number): string {
  return '  '.repeat(depth);
}

/** Deterministic type string for a primitive value. */
function primitiveType(value: unknown): string {
  if (value === null) return 'null';
  switch (typeof value) {
    case 'string':
      return 'string';
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    default:
      return 'unknown';
  }
}

// ─── Interface collector ─────────────────────────────────────────────────────

interface InterfaceField {
  key: string;
  typeStr: string;
  optional: boolean;
}

interface InterfaceDecl {
  name: string;
  fields: InterfaceField[];
}

/**
 * Walks a parsed JSON value and collects interface declarations.
 * Returns the TypeScript type string for the given value (which may reference
 * collected interfaces by name).
 */
function inferType(
  value: unknown,
  name: string,
  interfaces: InterfaceDecl[],
  seen: Map<string, string>
): string {
  if (value === null) return 'null';

  if (Array.isArray(value)) {
    if (value.length === 0) return 'unknown[]';

    // Infer element types from all array items
    const elementTypes: string[] = [];
    const objectShapes: Record<string, unknown>[] = [];

    for (const item of value) {
      if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
        objectShapes.push(item as Record<string, unknown>);
      } else {
        const t = inferType(item, `${name}Item`, interfaces, seen);
        if (!elementTypes.includes(t)) elementTypes.push(t);
      }
    }

    // If we have object shapes, merge them into a single interface
    if (objectShapes.length > 0) {
      const mergedType = mergeObjectShapes(objectShapes, `${name}Item`, interfaces, seen);
      if (!elementTypes.includes(mergedType)) elementTypes.push(mergedType);
    }

    const first = elementTypes[0];
    if (elementTypes.length === 1 && first !== undefined) return `${first}[]`;
    return `(${elementTypes.join(' | ')})[]`;
  }

  if (typeof value === 'object') {
    // Generate a named interface for this object
    const obj = value as Record<string, unknown>;
    return emitInterface(obj, name, interfaces, seen);
  }

  return primitiveType(value);
}

/**
 * Merge multiple object shapes (from an array) into one interface,
 * marking keys that don't appear in every element as optional.
 */
function mergeObjectShapes(
  shapes: Record<string, unknown>[],
  name: string,
  interfaces: InterfaceDecl[],
  seen: Map<string, string>
): string {
  // Collect all keys and count how many shapes include each key
  const keyCounts = new Map<string, number>();
  const keyValues = new Map<string, unknown[]>();

  for (const shape of shapes) {
    for (const [k, v] of Object.entries(shape)) {
      keyCounts.set(k, (keyCounts.get(k) ?? 0) + 1);
      const existing = keyValues.get(k) ?? [];
      existing.push(v);
      keyValues.set(k, existing);
    }
  }

  const interfaceName = toPascalCase(name);

  // Avoid duplicate interface names — if already seen with same structure, reuse it
  const existing = seen.get(interfaceName);
  if (existing !== undefined) return existing;
  seen.set(interfaceName, interfaceName);

  const fields: InterfaceField[] = [];

  for (const [key, values] of keyValues) {
    // Infer types from all values for this key
    const types = new Set<string>();
    for (const v of values) {
      types.add(inferType(v, `${name}${toPascalCase(key)}`, interfaces, seen));
    }

    const firstType = [...types][0] ?? 'unknown';
    const typeStr = types.size === 1 ? firstType : [...types].join(' | ');
    const optional = (keyCounts.get(key) ?? 0) < shapes.length;

    fields.push({ key, typeStr, optional });
  }

  interfaces.push({ name: interfaceName, fields });
  return interfaceName;
}

/** Emit a single interface for a plain object. */
function emitInterface(
  obj: Record<string, unknown>,
  name: string,
  interfaces: InterfaceDecl[],
  seen: Map<string, string>
): string {
  const interfaceName = toPascalCase(name);

  const existingName = seen.get(interfaceName);
  if (existingName !== undefined) return existingName;
  seen.set(interfaceName, interfaceName);

  const fields: InterfaceField[] = [];

  for (const [key, value] of Object.entries(obj)) {
    const fieldType = inferType(value, `${name}${toPascalCase(key)}`, interfaces, seen);
    fields.push({ key, typeStr: fieldType, optional: false });
  }

  interfaces.push({ name: interfaceName, fields });
  return interfaceName;
}

// ─── Renderer ────────────────────────────────────────────────────────────────

function renderInterface(
  decl: InterfaceDecl,
  style: 'interface' | 'type',
  allOptional: boolean,
  exportTypes: boolean
): string {
  const prefix = exportTypes ? 'export ' : '';
  const lines: string[] = [];

  if (style === 'interface') {
    lines.push(`${prefix}interface ${decl.name} {`);
  } else {
    lines.push(`${prefix}type ${decl.name} = {`);
  }

  for (const field of decl.fields) {
    const keyStr = isSafeKey(field.key) ? field.key : `"${field.key}"`;
    const opt = allOptional || field.optional ? '?' : '';
    lines.push(`${indent(1)}${keyStr}${opt}: ${field.typeStr};`);
  }

  if (style === 'interface') {
    lines.push('}');
  } else {
    lines.push('};');
  }

  return lines.join('\n');
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function jsonToTypescript(input: string, options?: TypeGenOptions): ConversionResult {
  const trimmed = input.trim();
  if (!trimmed) return { output: null, error: 'Input is empty.' };

  const rootName = options?.rootName ?? 'Root';
  const style = options?.style ?? 'interface';
  const allOptional = options?.allOptional ?? false;
  const exportTypes = options?.exportTypes ?? true;

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch (err) {
    return {
      output: null,
      error: `Invalid JSON: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  const interfaces: InterfaceDecl[] = [];
  const seen = new Map<string, string>();

  const rootType = inferType(parsed, rootName, interfaces, seen);

  // If the root value is a primitive or array (not an object that became an interface),
  // emit a type alias for it.
  const rootIsInterface = interfaces.some((d) => d.name === toPascalCase(rootName));

  const blocks: string[] = [];

  // Render all collected interfaces (dependencies first, root last)
  for (const decl of interfaces) {
    blocks.push(renderInterface(decl, style, allOptional, exportTypes));
  }

  // If root is not an interface (primitive, array), add a type alias
  if (!rootIsInterface) {
    const prefix = exportTypes ? 'export ' : '';
    blocks.push(`${prefix}type ${toPascalCase(rootName)} = ${rootType};`);
  }

  return { output: blocks.join('\n\n'), error: null };
}
