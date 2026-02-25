/**
 * URL encode/decode utilities.
 * Uses native encodeURIComponent / decodeURIComponent.
 *
 * Two modes:
 *   - component: encodes a single query value or path segment (most common)
 *   - full: encodes a full URL, preserving scheme/host/path separators
 */

export type UrlMode = 'encode' | 'decode';
export type UrlEncodeVariant = 'component' | 'full';

export interface UrlResult {
  output: string;
  error: null;
}

export interface UrlError {
  output: null;
  error: string;
}

export type UrlCodecResult = UrlResult | UrlError;

export function isUrlError(r: UrlCodecResult): r is UrlError {
  return r.error !== null;
}

export function encodeUrl(input: string, variant: UrlEncodeVariant = 'component'): UrlCodecResult {
  if (!input) return { output: '', error: null };
  try {
    const output =
      variant === 'component'
        ? encodeURIComponent(input)
        : // Preserve scheme, host, path, query structure — only encode each component
          input
            .split(/([?&#=+])/)
            .map((part, i) =>
              // Odd indices are the delimiters we split on — pass through unchanged
              i % 2 === 1 ? part : encodeURIComponent(part)
            )
            .join('');
    return { output, error: null };
  } catch (err) {
    return { output: null, error: err instanceof Error ? err.message : 'Encoding failed.' };
  }
}

export function decodeUrl(input: string): UrlCodecResult {
  if (!input) return { output: '', error: null };
  try {
    // decodeURIComponent handles both %XX and + (as-is — + is only space in form data)
    return { output: decodeURIComponent(input), error: null };
  } catch (err) {
    return {
      output: null,
      error: err instanceof Error ? err.message : 'Invalid percent-encoded input.',
    };
  }
}

/**
 * Heuristic: if the string contains percent-encoded sequences it's probably
 * already encoded and the user wants to decode it.
 */
export function looksLikeEncoded(input: string): boolean {
  return /%[0-9A-Fa-f]{2}/.test(input);
}

/**
 * Safely decode a percent-encoded string, returning the original on failure.
 * `decodeURIComponent` throws on malformed sequences like `%GG` or a bare `%`.
 */
function safeDecodeComponent(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s; // Return raw value rather than throwing to the UI
  }
}

/** Parse a query string into key→value pairs for structured display. */
export function parseQueryString(input: string): { key: string; value: string }[] {
  const s = input.startsWith('?') ? input.slice(1) : input;
  if (!s.trim()) return [];
  return s.split('&').map((pair) => {
    const eqIdx = pair.indexOf('=');
    if (eqIdx === -1) return { key: safeDecodeComponent(pair), value: '' };
    return {
      key: safeDecodeComponent(pair.slice(0, eqIdx)),
      value: safeDecodeComponent(pair.slice(eqIdx + 1)),
    };
  });
}
