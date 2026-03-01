import { create } from 'zustand';

export type CommandGroup = 'Navigation' | 'Settings' | 'Actions';

export interface Command {
  /** Unique identifier, e.g. 'nav:json-formatter', 'action:format' */
  id: string;
  /** Displayed in the palette list */
  label: string;
  group: CommandGroup;
  /** Extra search tokens that match this command */
  keywords?: string[];
  /** Icon component from lucide-react */
  icon?: React.ComponentType<{ className?: string }>;
  /** Display-only shortcut hint, e.g. '⌘ ⇧ K' */
  shortcut?: string;
  handler: () => void;
}

interface CommandState {
  commands: Command[];
  register: (commands: Command[]) => void;
  unregister: (ids: string[]) => void;
}

export const useCommandStore = create<CommandState>()((set) => ({
  commands: [],

  register: (newCommands) => {
    set((state) => {
      // Avoid duplicates — replace commands with the same id
      const existingIds = new Set(newCommands.map((c) => c.id));
      const filtered = state.commands.filter((c) => !existingIds.has(c.id));
      return { commands: [...filtered, ...newCommands] };
    });
  },

  unregister: (ids) => {
    set((state) => {
      const idsToRemove = new Set(ids);
      return { commands: state.commands.filter((c) => !idsToRemove.has(c.id)) };
    });
  },
}));
