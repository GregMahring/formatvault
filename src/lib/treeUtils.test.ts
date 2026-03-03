import { describe, it, expect } from 'vitest';
import {
  getValueType,
  buildJsonPath,
  countChildren,
  countTotalNodes,
  flattenTree,
  searchTree,
  formatValuePreview,
} from './treeUtils';

describe('getValueType', () => {
  it('identifies null', () => {
    expect(getValueType(null)).toBe('null');
  });
  it('identifies string', () => {
    expect(getValueType('hello')).toBe('string');
  });
  it('identifies number', () => {
    expect(getValueType(42)).toBe('number');
  });
  it('identifies boolean', () => {
    expect(getValueType(true)).toBe('boolean');
  });
  it('identifies array', () => {
    expect(getValueType([1, 2])).toBe('array');
  });
  it('identifies object', () => {
    expect(getValueType({ a: 1 })).toBe('object');
  });
});

describe('buildJsonPath', () => {
  it('builds dot notation for simple keys', () => {
    expect(buildJsonPath('$', 'name', false)).toBe('$.name');
  });

  it('builds bracket notation for array indices', () => {
    expect(buildJsonPath('$.items', '0', true)).toBe('$.items[0]');
  });

  it('builds bracket notation for keys with special chars', () => {
    expect(buildJsonPath('$', 'foo-bar', false)).toBe('$["foo-bar"]');
    expect(buildJsonPath('$', 'with spaces', false)).toBe('$["with spaces"]');
  });

  it('builds nested paths', () => {
    expect(buildJsonPath('$.users[0]', 'name', false)).toBe('$.users[0].name');
  });
});

describe('countChildren', () => {
  it('returns 0 for primitives', () => {
    expect(countChildren('hello')).toBe(0);
    expect(countChildren(42)).toBe(0);
    expect(countChildren(null)).toBe(0);
  });

  it('counts object keys', () => {
    expect(countChildren({ a: 1, b: 2, c: 3 })).toBe(3);
  });

  it('counts array elements', () => {
    expect(countChildren([1, 2, 3, 4])).toBe(4);
  });

  it('returns 0 for empty containers', () => {
    expect(countChildren({})).toBe(0);
    expect(countChildren([])).toBe(0);
  });
});

describe('countTotalNodes', () => {
  it('counts 1 for a primitive', () => {
    expect(countTotalNodes('hello')).toBe(1);
  });

  it('counts nested structure', () => {
    expect(countTotalNodes({ a: 1, b: { c: 2 } })).toBe(4); // root + a + b + c
  });

  it('counts arrays', () => {
    expect(countTotalNodes([1, 2, 3])).toBe(4); // root array + 3 elements
  });
});

describe('flattenTree', () => {
  it('flattens a simple object with root expanded', () => {
    const data = { name: 'Alice', age: 30 };
    const expanded = new Set(['$']);
    const nodes = flattenTree(data, expanded);

    expect(nodes).toHaveLength(3); // root + 2 fields
    expect(nodes[0]!.path).toBe('$');
    expect(nodes[0]!.depth).toBe(0);
    expect(nodes[1]!.path).toBe('$.name');
    expect(nodes[1]!.key).toBe('name');
    expect(nodes[2]!.path).toBe('$.age');
  });

  it('collapses children when parent not in expanded set', () => {
    const data = { nested: { deep: 'value' } };
    const expanded = new Set(['$']); // only root expanded, not $.nested
    const nodes = flattenTree(data, expanded);

    expect(nodes).toHaveLength(2); // root + nested (but not deep)
    expect(nodes[1]!.path).toBe('$.nested');
    expect(nodes[1]!.childCount).toBe(1);
  });

  it('shows nested children when parent is expanded', () => {
    const data = { nested: { deep: 'value' } };
    const expanded = new Set(['$', '$.nested']);
    const nodes = flattenTree(data, expanded);

    expect(nodes).toHaveLength(3);
    expect(nodes[2]!.path).toBe('$.nested.deep');
    expect(nodes[2]!.depth).toBe(2);
  });

  it('handles arrays', () => {
    const data = [1, 2, 3];
    const expanded = new Set(['$']);
    const nodes = flattenTree(data, expanded);

    expect(nodes).toHaveLength(4);
    expect(nodes[1]!.path).toBe('$[0]');
    expect(nodes[1]!.isArrayIndex).toBe(true);
  });

  it('returns only root when nothing expanded', () => {
    const data = { a: 1, b: 2 };
    const expanded = new Set<string>();
    const nodes = flattenTree(data, expanded);

    expect(nodes).toHaveLength(1);
    expect(nodes[0]!.path).toBe('$');
  });
});

describe('searchTree', () => {
  it('returns empty set for empty query', () => {
    expect(searchTree({ a: 1 }, '').size).toBe(0);
    expect(searchTree({ a: 1 }, '   ').size).toBe(0);
  });

  it('matches on keys', () => {
    const matches = searchTree({ name: 'Alice', age: 30 }, 'name');
    expect(matches.has('$.name')).toBe(true);
    expect(matches.has('$')).toBe(true); // ancestor
  });

  it('matches on string values', () => {
    const matches = searchTree({ name: 'Alice', city: 'NYC' }, 'alice');
    expect(matches.has('$.name')).toBe(true);
  });

  it('matches on number values', () => {
    const matches = searchTree({ count: 42 }, '42');
    expect(matches.has('$.count')).toBe(true);
  });

  it('is case-insensitive', () => {
    const matches = searchTree({ Name: 'ALICE' }, 'alice');
    expect(matches.has('$.Name')).toBe(true);
  });

  it('includes ancestor paths for nested matches', () => {
    const data = { user: { address: { city: 'NYC' } } };
    const matches = searchTree(data, 'NYC');
    expect(matches.has('$.user.address.city')).toBe(true);
    expect(matches.has('$')).toBe(true);
  });
});

describe('formatValuePreview', () => {
  it('formats null', () => {
    expect(formatValuePreview(null)).toBe('null');
  });
  it('formats strings', () => {
    expect(formatValuePreview('hello')).toBe('"hello"');
  });
  it('formats numbers', () => {
    expect(formatValuePreview(42)).toBe('42');
  });
  it('formats booleans', () => {
    expect(formatValuePreview(true)).toBe('true');
  });
  it('formats arrays', () => {
    expect(formatValuePreview([1, 2, 3])).toBe('Array(3)');
  });
  it('formats objects', () => {
    expect(formatValuePreview({ a: 1, b: 2 })).toBe('{2 keys}');
  });

  it('truncates long strings', () => {
    const long = 'a'.repeat(100);
    const preview = formatValuePreview(long, 20);
    expect(preview).toBe(`"${'a'.repeat(20)}..."`);
  });
});
