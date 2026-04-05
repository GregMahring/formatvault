import { create } from 'zustand';

/**
 * In-memory store for shuttling a pasted value from the home page to the
 * destination tool route. NEVER persisted (ADR-0010).
 *
 * Contract: call setInput() before navigating, then read + reset() on mount
 * in the destination route. All other editor state (output, error, processing)
 * is owned locally by each feature hook.
 */
interface EditorState {
  input: string;
}

interface EditorActions {
  setInput: (input: string) => void;
  /** Clear the store after the destination route has consumed the value. */
  reset: () => void;
}

export const useEditorStore = create<EditorState & EditorActions>()((set) => ({
  input: '',

  setInput: (input) => {
    set({ input });
  },
  reset: () => {
    set({ input: '' });
  },
}));
