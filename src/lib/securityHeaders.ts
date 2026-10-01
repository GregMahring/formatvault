// Bundled at build time so public/_headers stays the single source of truth for
// ADR-0007's policy — the static-asset rules and the SSR document headers can't drift.
import headersFile from '../../public/_headers?raw';

export type HeaderRules = Map<string, [name: string, value: string][]>;

/**
 * Parse a Cloudflare Pages `_headers` file: an unindented line starts a URL
 * pattern, indented `Name: value` lines below it belong to that pattern, and
 * `#` lines are comments.
 */
export function parseHeadersFile(text: string): HeaderRules {
  const rules: HeaderRules = new Map();
  let current: [string, string][] | null = null;

  for (const raw of text.split(/\r?\n/)) {
    const trimmed = raw.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    if (!/^\s/.test(raw)) {
      current = rules.get(trimmed) ?? [];
      rules.set(trimmed, current);
      continue;
    }

    const colon = trimmed.indexOf(':');
    if (current && colon > 0) {
      current.push([trimmed.slice(0, colon).trim(), trimmed.slice(colon + 1).trim()]);
    }
  }
  return rules;
}

/** Headers from the `/*` block, which Cloudflare applies to every static response. */
export const DOCUMENT_HEADERS: readonly [string, string][] =
  parseHeadersFile(headersFile).get('/*') ?? [];

/**
 * Set the site-wide security headers on a server-rendered response.
 * Overrides any value a route set, so no route can weaken the policy.
 */
export function applyDocumentHeaders(
  headers: Headers,
  rules: readonly [string, string][] = DOCUMENT_HEADERS
): void {
  for (const [name, value] of rules) headers.set(name, value);
}
