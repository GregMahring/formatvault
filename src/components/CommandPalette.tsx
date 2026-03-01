import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Search } from 'lucide-react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';
import { type Command, type CommandGroup, useCommandStore } from '@/stores/commandStore';
import { scoreCommand } from '@/lib/fuzzyMatch';

const GROUP_ORDER: CommandGroup[] = ['Actions', 'Navigation', 'Settings'];

interface GroupedCommands {
  group: CommandGroup;
  commands: Command[];
}

function groupAndFilter(commands: Command[], query: string): GroupedCommands[] {
  const scored = commands
    .map((cmd) => ({
      cmd,
      score: query ? scoreCommand(cmd.label, cmd.keywords, query) : 0,
    }))
    .filter((entry) => entry.score >= 0)
    .sort((a, b) => b.score - a.score);

  const groups: GroupedCommands[] = [];
  for (const group of GROUP_ORDER) {
    const items = scored.filter((s) => s.cmd.group === group).map((s) => s.cmd);
    if (items.length > 0) {
      groups.push({ group, commands: items });
    }
  }
  return groups;
}

function flattenGroups(groups: GroupedCommands[]): Command[] {
  return groups.flatMap((g) => g.commands);
}

export interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const commands = useCommandStore((s) => s.commands);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const grouped = useMemo(() => groupAndFilter(commands, query), [commands, query]);
  const flat = useMemo(() => flattenGroups(grouped), [grouped]);

  // Reset state when opening
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [open]);

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const selected = listRef.current.querySelector('[data-selected="true"]');
    if (selected) {
      selected.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  const executeCommand = useCallback(
    (cmd: Command) => {
      onOpenChange(false);
      // Defer handler to allow dialog close animation
      requestAnimationFrame(() => {
        cmd.handler();
      });
    },
    [onOpenChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % Math.max(flat.length, 1));
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + flat.length) % Math.max(flat.length, 1));
          break;
        }
        case 'Enter': {
          e.preventDefault();
          const cmd = flat[selectedIndex];
          if (cmd) executeCommand(cmd);
          break;
        }
        case 'Escape': {
          e.preventDefault();
          onOpenChange(false);
          break;
        }
      }
    },
    [flat, selectedIndex, executeCommand, onOpenChange]
  );

  // Reset selection when filtered list changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Track the flat index for rendering
  let flatIdx = -1;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className="fixed left-[50%] top-[20%] z-50 w-full max-w-md translate-x-[-50%] overflow-hidden rounded-lg border border-gray-800 bg-gray-950 shadow-2xl"
          onKeyDown={handleKeyDown}
          aria-label="Command palette"
        >
          <DialogPrimitive.Title className="sr-only">Command palette</DialogPrimitive.Title>

          {/* Search input */}
          <div className="flex items-center gap-2 border-b border-gray-800 px-3">
            <Search className="h-4 w-4 shrink-0 text-gray-500" aria-hidden="true" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
              }}
              placeholder="Type a command..."
              className="h-11 w-full bg-transparent text-sm text-gray-100 placeholder:text-gray-600 focus:outline-none"
              // eslint-disable-next-line jsx-a11y/no-autofocus -- intentional: palette must grab focus on open
              autoFocus
              autoComplete="off"
              spellCheck={false}
            />
            <kbd className="hidden shrink-0 rounded border border-gray-700 bg-gray-900 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 sm:inline-block">
              ESC
            </kbd>
          </div>

          {/* Command list */}
          <div
            ref={listRef}
            className="max-h-72 overflow-y-auto overscroll-contain p-1"
            role="listbox"
            aria-label="Commands"
          >
            {flat.length === 0 && (
              <div className="px-3 py-6 text-center text-sm text-gray-600">No commands found</div>
            )}

            {grouped.map(({ group, commands: groupCmds }) => (
              <div key={group} role="group" aria-label={group}>
                <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-600">
                  {group}
                </div>
                {groupCmds.map((cmd) => {
                  flatIdx++;
                  const isSelected = flatIdx === selectedIndex;
                  const currentIdx = flatIdx;

                  return (
                    <button
                      key={cmd.id}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      data-selected={isSelected}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm transition-colors',
                        isSelected
                          ? 'bg-gray-800 text-gray-100'
                          : 'text-gray-400 hover:bg-gray-900 hover:text-gray-200'
                      )}
                      onClick={() => {
                        executeCommand(cmd);
                      }}
                      onMouseEnter={() => {
                        setSelectedIndex(currentIdx);
                      }}
                    >
                      {cmd.icon && (
                        <cmd.icon
                          className={cn(
                            'h-4 w-4 shrink-0',
                            isSelected ? 'text-accent-400' : 'text-gray-600'
                          )}
                        />
                      )}
                      <span className="flex-1 truncate">{cmd.label}</span>
                      {cmd.shortcut && (
                        <kbd className="shrink-0 rounded border border-gray-700 bg-gray-900 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
                          {cmd.shortcut}
                        </kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
