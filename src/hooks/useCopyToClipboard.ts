import { useState, useCallback } from 'react';

export interface UseCopyToClipboardResult {
  /** Call with the text to copy. Returns true on success. */
  copy: (text: string) => Promise<boolean>;
  /** True for ~2s after a successful copy */
  copied: boolean;
  /** Error message if copy failed */
  error: string | null;
}

/**
 * Clipboard hook with a brief "Copied!" feedback state.
 * Falls back to execCommand for older browsers.
 */
export function useCopyToClipboard(resetDelay = 2000): UseCopyToClipboardResult {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const copy = useCallback(
    async (text: string): Promise<boolean> => {
      setError(null);

      // Try modern Clipboard API first (throws in insecure contexts → fall through)
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => {
          setCopied(false);
        }, resetDelay);
        return true;
      } catch {
        // Fall through to legacy execCommand
      }

      // Legacy fallback
      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        // eslint-disable-next-line @typescript-eslint/no-deprecated -- required for legacy browser fallback
        const success = document.execCommand('copy');
        document.body.removeChild(textarea);
        if (success) {
          setCopied(true);
          setTimeout(() => {
            setCopied(false);
          }, resetDelay);
          return true;
        }
        throw new Error('execCommand copy returned false');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Copy failed';
        setError(msg);
        return false;
      }
    },
    [resetDelay]
  );

  return { copy, copied, error };
}
