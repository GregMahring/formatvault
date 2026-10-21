import { useRef } from 'react';

/**
 * Focus-return handlers for Radix Dialog content opened without a `Dialog.Trigger`
 * (keyboard shortcut, toolbar button). Radix only restores focus to its own trigger,
 * so without this, closing the dialog drops focus to <body> (WCAG 2.4.3).
 *
 * Spread the result onto `DialogPrimitive.Content`.
 */
export function useReturnFocus() {
  const returnTo = useRef<HTMLElement | null>(null);

  return {
    // Runs before Radix moves focus into the dialog, so this is still the opener.
    onOpenAutoFocus: () => {
      returnTo.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
    },
    onCloseAutoFocus: (event: Event) => {
      const target = returnTo.current;
      returnTo.current = null;
      if (target?.isConnected) {
        event.preventDefault();
        target.focus();
      }
    },
  };
}
