import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'dark' | 'light';
export type IndentSize = 2 | 4 | 8;

interface SettingsState {
  theme: Theme;
  editorFontSize: number;
  indentSize: IndentSize;
  indentWithTabs: boolean;
  autoFormat: boolean;
  wordWrap: boolean;
}

interface SettingsActions {
  setTheme: (theme: Theme) => void;
  setEditorFontSize: (size: number) => void;
  setIndentSize: (size: IndentSize) => void;
  setIndentWithTabs: (enabled: boolean) => void;
  setAutoFormat: (enabled: boolean) => void;
  setWordWrap: (enabled: boolean) => void;
  resetToDefaults: () => void;
}

const defaults: SettingsState = {
  theme: 'dark',
  editorFontSize: 14,
  indentSize: 2,
  indentWithTabs: false,
  autoFormat: false, // Explicit action preferred over auto — avoids surprise reformatting
  wordWrap: true,
};

export const useSettingsStore = create<SettingsState & SettingsActions>()(
  persist(
    (set) => ({
      ...defaults,

      setTheme: (theme) => {
        // Sync the dark/light class and color-scheme on <html> immediately
        document.documentElement.classList.toggle('dark', theme === 'dark');
        document.documentElement.classList.toggle('light', theme === 'light');
        document.documentElement.style.colorScheme = theme;
        set({ theme });
      },

      setEditorFontSize: (editorFontSize) => set({ editorFontSize }),
      setIndentSize: (indentSize) => set({ indentSize }),
      setIndentWithTabs: (indentWithTabs) => set({ indentWithTabs }),
      setAutoFormat: (autoFormat) => set({ autoFormat }),
      setWordWrap: (wordWrap) => set({ wordWrap }),

      resetToDefaults: () => set(defaults),
    }),
    {
      name: 'formatvault-settings',
      // Only persist non-sensitive UI preferences (ADR-0010)
      partialize: (state) => ({
        theme: state.theme,
        editorFontSize: state.editorFontSize,
        indentSize: state.indentSize,
        indentWithTabs: state.indentWithTabs,
        autoFormat: state.autoFormat,
        wordWrap: state.wordWrap,
      }),
    }
  )
);
