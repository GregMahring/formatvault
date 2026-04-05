import { useEffect } from 'react';
import { useEditorStore } from '@/stores/editorStore';

/**
 * On mount, reads any value that was pre-loaded into `editorStore` (e.g. from
 * the home-page paste flow), calls `setInput` with it, then resets the store.
 * No-ops when the store is empty.
 *
 * Replaces the identical three-line `useEffect` pattern that previously appeared
 * in every formatter, converter, and utility route.
 */
export function usePreloadedInput(setInput: (value: string) => void): void {
  useEffect(() => {
    const preloaded = useEditorStore.getState().input;
    if (preloaded) {
      setInput(preloaded);
      useEditorStore.getState().reset();
    }
    // Empty deps: run once on mount only. setInput is intentionally excluded —
    // callers must pass a stable reference (useState setter or useCallback).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
