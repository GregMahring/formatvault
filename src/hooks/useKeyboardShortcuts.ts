import { useEffect, useCallback } from 'react';

export interface Shortcut {
  /** Human-readable label shown in the help modal */
  label: string;
  /** Key combination description shown in help (e.g. "⌘ Enter") */
  display: string;
  /** The key to match (e.g. 'Enter', 'k', '/') */
  key: string;
  /** Require Cmd (Mac) or Ctrl (Win/Linux) */
  meta?: boolean;
  /** Require Shift */
  shift?: boolean;
  /** Require Alt/Option */
  alt?: boolean;
  handler: () => void;
}

/**
 * Register keyboard shortcuts at the document level.
 * All shortcuts are automatically unregistered when the component unmounts.
 *
 * @param shortcuts  Array of shortcut definitions
 * @param enabled    Set to false to temporarily disable all shortcuts (e.g. when a modal is open)
 */
export function useKeyboardShortcuts(shortcuts: Shortcut[], enabled = true) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      // Don't fire shortcuts when typing in an input/textarea (except for meta combos)
      const target = e.target as HTMLElement;
      const isTextInput =
        target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      for (const shortcut of shortcuts) {
        const metaMatch = shortcut.meta ? e.metaKey || e.ctrlKey : !e.metaKey && !e.ctrlKey;
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
        const altMatch = shortcut.alt ? e.altKey : !e.altKey;

        if (e.key === shortcut.key && metaMatch && shiftMatch && altMatch) {
          // Allow meta shortcuts inside text inputs (e.g. ⌘+Enter to format)
          if (isTextInput && !shortcut.meta) continue;
          e.preventDefault();
          shortcut.handler();
          return;
        }
      }
    },
    [shortcuts, enabled]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}
