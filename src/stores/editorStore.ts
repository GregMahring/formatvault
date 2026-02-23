import { create } from 'zustand';

/**
 * In-memory editor state — NEVER persisted (ADR-0010).
 * Users may paste API keys, credentials, or PII; we do not save any of it.
 */
interface EditorState {
  input: string;
  output: string;
  error: string | null;
  isProcessing: boolean;
}

interface EditorActions {
  setInput: (input: string) => void;
  setOutput: (output: string) => void;
  setError: (error: string | null) => void;
  setIsProcessing: (isProcessing: boolean) => void;
  /** Reset all editor state — called on route change to avoid stale content across tools */
  reset: () => void;
}

const emptyState: EditorState = {
  input: '',
  output: '',
  error: null,
  isProcessing: false,
};

export const useEditorStore = create<EditorState & EditorActions>()((set) => ({
  ...emptyState,

  setInput: (input) => {
    set({ input });
  },
  setOutput: (output) => {
    set({ output });
  },
  setError: (error) => {
    set({ error });
  },
  setIsProcessing: (isProcessing) => {
    set({ isProcessing });
  },
  reset: () => {
    set(emptyState);
  },
}));
