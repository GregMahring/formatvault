import { useState, useMemo } from 'react';
import { maskPii, type MaskResult } from '@/lib/piiMasker';

export interface PiiMaskingState {
  /** Whether masking is currently enabled */
  enabled: boolean;
  /** Toggle masking on/off */
  setEnabled: (enabled: boolean) => void;
  /** Content to display — masked if enabled, original otherwise */
  displayContent: string;
  /** Total number of PII matches found */
  matchCount: number;
  /** Breakdown by category */
  summary: MaskResult['summary'];
}

/**
 * Hook for opt-in PII masking on output content.
 * Memoizes the mask computation to avoid re-running on every render.
 */
export function usePiiMasking(content: string): PiiMaskingState {
  const [enabled, setEnabled] = useState(false);

  const result = useMemo(() => {
    if (!enabled || !content) return null;
    return maskPii(content);
  }, [enabled, content]);

  return {
    enabled,
    setEnabled,
    displayContent: enabled && result ? result.masked : content,
    matchCount: result?.totalCount ?? 0,
    summary: result?.summary ?? {},
  };
}
