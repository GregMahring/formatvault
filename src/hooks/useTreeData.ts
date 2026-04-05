import { useMemo } from 'react';

/**
 * Parses `output` (falling back to `input`) into an unknown value for use with
 * `<TreeView>`. Returns `undefined` when the source is empty or parse fails.
 *
 * `parse` must be a stable reference (module-level function or `useCallback`)
 * so the memoisation dep comparison works correctly.
 *
 * Replaces the identical `useMemo` block that previously appeared in
 * `json-formatter`, `yaml-formatter`, and `toml-formatter`.
 */
export function useTreeData(
  output: string,
  input: string,
  parse: (source: string) => unknown
): unknown {
  return useMemo(() => {
    const source = output || input;
    if (!source.trim()) return undefined;
    try {
      return parse(source);
    } catch {
      return undefined;
    }
  }, [output, input, parse]);
}
