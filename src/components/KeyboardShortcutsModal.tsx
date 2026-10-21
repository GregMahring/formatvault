import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X, Keyboard } from 'lucide-react';
import type { Shortcut } from '@/hooks/useKeyboardShortcuts';
import { useReturnFocus } from '@/hooks/useReturnFocus';

export interface KeyboardShortcutsModalProps {
  shortcuts: Shortcut[];
  isOpen: boolean;
  onClose: () => void;
}

// Own text colour: inherited fg-tertiary is under 4.5:1 on the elevated key background in light mode
const kbdClass =
  'rounded border border-edge-emphasis bg-surface-elevated px-1 py-0.5 font-mono text-[10px] text-fg-secondary';

/**
 * Modal overlay showing all registered keyboard shortcuts for the current page.
 * Triggered by pressing ? or clicking the keyboard icon in the toolbar.
 *
 * Built on Radix Dialog for focus management: focus moves into the dialog on open and
 * Tab is trapped inside it; useReturnFocus sends focus back to the opener on close
 * (WCAG 2.4.3).
 */
export function KeyboardShortcutsModal({
  shortcuts,
  isOpen,
  onClose,
}: KeyboardShortcutsModalProps) {
  const returnFocus = useReturnFocus();

  return (
    <DialogPrimitive.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <DialogPrimitive.Content
          {...returnFocus}
          className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg border border-edge-emphasis bg-surface-raised shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center gap-2 border-b border-edge px-4 py-3">
            <Keyboard className="h-4 w-4 text-fg-secondary" aria-hidden="true" />
            <DialogPrimitive.Title className="flex-1 text-sm font-semibold text-fg">
              Keyboard shortcuts
            </DialogPrimitive.Title>
            <DialogPrimitive.Close
              className="rounded p-1 text-fg-secondary hover:bg-surface-elevated hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
              aria-label="Close shortcuts"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </DialogPrimitive.Close>
          </div>

          <DialogPrimitive.Description className="sr-only">
            Keyboard shortcuts available on this page.
          </DialogPrimitive.Description>

          {/* Shortcut list */}
          <ul className="divide-y divide-edge">
            {shortcuts.map((s, i) => (
              <li key={i} className="flex items-center justify-between px-4 py-2.5">
                <span className="text-sm text-fg-secondary">{s.label}</span>
                <kbd className="rounded border border-edge-emphasis bg-surface-elevated px-2 py-0.5 font-mono text-xs text-fg-secondary">
                  {s.display}
                </kbd>
              </li>
            ))}
            {/* Tab indents inside the code editors, so the way out must be stated (WCAG 2.1.2) */}
            <li className="flex items-center justify-between px-4 py-2.5">
              <span className="text-sm text-fg-secondary">Leave the code editor</span>
              <span className="text-xs text-fg-secondary">
                <kbd className={kbdClass}>Esc</kbd> then <kbd className={kbdClass}>Tab</kbd>
              </span>
            </li>
          </ul>

          {/* Footer hint */}
          <div className="border-t border-edge px-4 py-2.5 text-center text-xs text-fg-tertiary">
            Press <kbd className={kbdClass}>?</kbd> or <kbd className={kbdClass}>Esc</kbd> to
            dismiss
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
