import { useState, useCallback, useMemo, useEffect } from 'react';
import { searchTree, countTotalNodes } from '@/lib/treeUtils';

export interface UseTreeStateReturn {
  expandedPaths: ReadonlySet<string>;
  searchQuery: string;
  matchingPaths: ReadonlySet<string>;
  isSearching: boolean;
  totalNodes: number;
  toggleNode: (path: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  setSearchQuery: (query: string) => void;
}

/** Collect all paths in the data for expand-all. */
function collectAllPaths(data: unknown, path = '$'): string[] {
  const paths = [path];
  if (Array.isArray(data)) {
    for (let i = 0; i < data.length; i++) {
      paths.push(...collectAllPaths(data[i], `${path}[${String(i)}]`));
    }
  } else if (typeof data === 'object' && data !== null) {
    for (const [k, v] of Object.entries(data)) {
      const childPath = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k) ? `${path}.${k}` : `${path}["${k}"]`;
      paths.push(...collectAllPaths(v, childPath));
    }
  }
  return paths;
}

export function useTreeState(data: unknown): UseTreeStateReturn {
  // Default: root expanded
  const [expandedPaths, setExpandedPaths] = useState<ReadonlySet<string>>(() => new Set(['$']));
  const [searchQuery, setSearchQuery] = useState('');

  const totalNodes = useMemo(() => countTotalNodes(data), [data]);

  // Reset expanded state when data changes (keep root expanded)
  useEffect(() => {
    setExpandedPaths(new Set(['$']));
    setSearchQuery('');
  }, [data]);

  const matchingPaths = useMemo(
    () => (searchQuery.trim() ? searchTree(data, searchQuery) : new Set<string>()),
    [data, searchQuery]
  );

  // When searching, auto-expand all ancestor paths of matches
  useEffect(() => {
    if (searchQuery.trim() && matchingPaths.size > 0) {
      setExpandedPaths((prev) => {
        const next = new Set(prev);
        for (const p of matchingPaths) next.add(p);
        return next;
      });
    }
  }, [matchingPaths, searchQuery]);

  const toggleNode = useCallback((path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    const all = collectAllPaths(data);
    setExpandedPaths(new Set(all));
  }, [data]);

  const collapseAll = useCallback(() => {
    setExpandedPaths(new Set<string>());
  }, []);

  return {
    expandedPaths,
    searchQuery,
    matchingPaths,
    isSearching: searchQuery.trim().length > 0,
    totalNodes,
    toggleNode,
    expandAll,
    collapseAll,
    setSearchQuery,
  };
}
