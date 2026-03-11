import * as React from 'react';
import { X, Keyboard } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Shortcut } from '@/hooks/useKeyboardShortcuts';

export interface KeyboardShortcutsModalProps {
  shortcuts: Shortcut[];
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modal overlay showing all registered keyboard shortcuts for the current page.
 * Triggered by pressing ? or clicking the keyboard icon in the toolbar.
 */
export function KeyboardShortcutsModal({
  shortcuts,
  isOpen,
  onClose,
}: KeyboardShortcutsModalProps) {
  // Close on Escape
  React.useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => {
      document.removeEventListener('keydown', handler);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
    >
      {/* Invisible backdrop button for click-outside-to-close */}
      <button
        type="button"
        className="absolute inset-0"
        aria-label="Close shortcuts"
        onClick={onClose}
        tabIndex={-1}
      />
      {/* Panel */}
      <div className="relative w-full max-w-sm rounded-lg border border-edge-emphasis bg-surface-raised shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-edge px-4 py-3">
          <Keyboard className="h-4 w-4 text-fg-secondary" aria-hidden="true" />
          <h2 className="flex-1 text-sm font-semibold text-fg">Keyboard shortcuts</h2>
          <button
            type="button"
            className="rounded p-1 text-fg-tertiary hover:bg-surface-elevated hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
            onClick={onClose}
            aria-label="Close shortcuts"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Shortcut list */}
        <ul className="divide-y divide-edge">
          {shortcuts.map((s, i) => (
            <li key={i} className="flex items-center justify-between px-4 py-2.5">
              <span className="text-sm text-fg-secondary">{s.label}</span>
              <kbd
                className={cn(
                  'rounded border border-edge-emphasis bg-surface-elevated px-2 py-0.5 font-mono text-xs text-fg-secondary'
                )}
              >
                {s.display}
              </kbd>
            </li>
          ))}
        </ul>

        {/* Footer hint */}
        <div className="border-t border-edge px-4 py-2.5 text-center text-xs text-fg-muted">
          Press{' '}
          <kbd className="rounded border border-edge-emphasis bg-surface-elevated px-1 py-0.5 font-mono text-[10px]">
            ?
          </kbd>{' '}
          or{' '}
          <kbd className="rounded border border-edge-emphasis bg-surface-elevated px-1 py-0.5 font-mono text-[10px]">
            Esc
          </kbd>{' '}
          to dismiss
        </div>
      </div>
    </div>
  );
}
