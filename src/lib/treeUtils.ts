/**
 * Pure utility functions for the JSON/YAML tree view.
 * No React dependencies — these operate on plain JavaScript values.
 */

export type ValueType = 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';

export interface FlatTreeNode {
  /** JSONPath-style path, e.g. "$.users[0].name" */
  path: string;
  /** Display key (property name or array index) */
  key: string;
  /** The raw value at this node */
  value: unknown;
  /** Inferred type of the value */
  type: ValueType;
  /** Nesting depth (0 = root) */
  depth: number;
  /** Number of direct children (0 for primitives) */
  childCount: number;
  /** Whether this node is an array index */
  isArrayIndex: boolean;
}

/** Get the ValueType for any JavaScript value. */
export function getValueType(value: unknown): ValueType {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  switch (typeof value) {
    case 'string':
      return 'string';
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'object':
      return 'object';
    default:
      return 'string';
  }
}

/** Build a JSONPath string for a child node. */
export function buildJsonPath(parentPath: string, key: string, isArrayIndex: boolean): string {
  if (isArrayIndex) return `${parentPath}[${key}]`;
  // Dot notation for simple keys, bracket notation for others
  if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)) return `${parentPath}.${key}`;
  return `${parentPath}["${key}"]`;
}

/** Count direct children of a value. */
export function countChildren(value: unknown): number {
  if (Array.isArray(value)) return value.length;
  if (typeof value === 'object' && value !== null) return Object.keys(value).length;
  return 0;
}

/** Count total nodes (recursive) in a value. */
export function countTotalNodes(value: unknown): number {
  let count = 1;
  if (Array.isArray(value)) {
    for (const item of value) {
      count += countTotalNodes(item);
    }
  } else if (typeof value === 'object' && value !== null) {
    for (const v of Object.values(value)) {
      count += countTotalNodes(v);
    }
  }
  return count;
}

/**
 * Flatten a tree into a list of visible FlatTreeNode items,
 * respecting the expanded state. Only nodes whose parents are
 * all expanded will appear in the output.
 */
export function flattenTree(
  data: unknown,
  expandedPaths: ReadonlySet<string>,
  rootKey?: string
): FlatTreeNode[] {
  const result: FlatTreeNode[] = [];

  function walk(
    value: unknown,
    path: string,
    key: string,
    depth: number,
    isArrayIndex: boolean
  ): void {
    const type = getValueType(value);
    const children = countChildren(value);

    result.push({ path, key, value, type, depth, childCount: children, isArrayIndex });

    // Only recurse into children if this node is expanded
    if (children > 0 && expandedPaths.has(path)) {
      if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i++) {
          const childPath = buildJsonPath(path, String(i), true);
          walk(value[i], childPath, String(i), depth + 1, true);
        }
      } else if (typeof value === 'object' && value !== null) {
        for (const [k, v] of Object.entries(value)) {
          const childPath = buildJsonPath(path, k, false);
          walk(v, childPath, k, depth + 1, false);
        }
      }
    }
  }

  walk(data, '$', rootKey ?? '$', 0, false);
  return result;
}

/**
 * Search a tree for nodes whose key or string value contains the query.
 * Returns a Set of paths that match, plus all their ancestor paths
 * (so the tree can be shown with matching nodes visible).
 */
export function searchTree(data: unknown, query: string): Set<string> {
  if (!query.trim()) return new Set<string>();

  const lowerQuery = query.toLowerCase();
  const matchingPaths = new Set<string>();

  function walk(value: unknown, path: string, key: string): void {
    let isMatch = false;

    // Match on key
    if (key.toLowerCase().includes(lowerQuery)) isMatch = true;

    // Match on string/number/boolean value
    if (!isMatch && value !== null && typeof value !== 'object') {
      if (
        String(value as string | number | boolean)
          .toLowerCase()
          .includes(lowerQuery)
      )
        isMatch = true;
    }

    if (isMatch) {
      // Add this path and all ancestors
      matchingPaths.add(path);
      const parts = path.split(/(?=\[)|(?=\.)/);
      let ancestor = '';
      for (const part of parts) {
        ancestor += part;
        matchingPaths.add(ancestor);
      }
      // Always include root
      matchingPaths.add('$');
    }

    // Recurse into children regardless (to find matches deeper in the tree)
    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        walk(value[i], buildJsonPath(path, String(i), true), String(i));
      }
    } else if (typeof value === 'object' && value !== null) {
      for (const [k, v] of Object.entries(value)) {
        walk(v, buildJsonPath(path, k, false), k);
      }
    }
  }

  walk(data, '$', '$');
  return matchingPaths;
}

/** Format a preview of a value for display (truncated). */
export function formatValuePreview(value: unknown, maxLength = 80): string {
  if (value === null) return 'null';
  if (typeof value === 'string') {
    const truncated = value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
    return `"${truncated}"`;
  }
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return `Array(${String(value.length)})`;
  if (typeof value === 'object') return `{${String(Object.keys(value).length)} keys}`;
  return String(value as string | number | boolean);
}
