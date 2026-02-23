# formatvault — Project Planning Reference

> **Status:** Locked. All decisions finalized as of 2026-02-22.
> This document is the authoritative reference for the agreed project scope, architecture, and build plan.
> Changes require explicit discussion and a corresponding ADR update.

---

## What We're Building

**formatvault** is a 100% client-side, privacy-first developer tool for formatting, validating, and converting data formats. All processing happens in the browser — no user data ever leaves the device.

**Target audience:** Developers. UI should feel like Warp, Linear, or Raycast — clean, dark, dense, keyboard-first.

**Core value proposition:** "No data leaves your browser." This is a genuine architectural guarantee, not marketing copy.

---

## Finalized Tech Stack

| Category        | Choice                                      | Notes                                                                   |
| --------------- | ------------------------------------------- | ----------------------------------------------------------------------- |
| **Language**    | TypeScript 5.x strict                       | `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`      |
| **UI**          | React 19                                    | Function components + hooks only. No class components.                  |
| **Build**       | Vite (latest stable)                        | + `@vitejs/plugin-react-swc` (SWC for faster builds)                    |
| **Router**      | React Router v7 (framework mode)            | Built-in SSR for meta tags. See ADR-0003.                               |
| **State**       | Zustand v5                                  | Preferences only to localStorage. Editor state in-memory. See ADR-0004. |
| **Styling**     | Tailwind CSS v4                             | Dark mode default. See ADR-0005.                                        |
| **Components**  | Radix UI + shadcn/ui                        | Accessible primitives + owned components. See ADR-0005.                 |
| **Code Editor** | CodeMirror 6                                | ~200KB vs Monaco's 1MB+. Lazy-loaded language packs. See ADR-0011.      |
| **Testing**     | Vitest + React Testing Library + Playwright | Unit, component, E2E.                                                   |
| **Hosting**     | Cloudflare Pages + Workers                  | No cold starts, best security, lowest cost at scale. See ADR-0002.      |
| **Analytics**   | Plausible                                   | Privacy-respecting, no cookies, per-route traffic. See ADR-0006.        |
| **CI/CD**       | GitHub Actions → wrangler deploy            | type-check → lint → test → build → deploy                               |

---

## Format Libraries

| Format             | Library                                | Notes                                           |
| ------------------ | -------------------------------------- | ----------------------------------------------- |
| JSON (standard)    | Native `JSON.parse` / `JSON.stringify` |                                                 |
| JSON (relaxed)     | `json5`                                | Handles trailing commas, comments               |
| JSON (large files) | `@streamparser/json`                   | Streaming parser for files ≥ 5MB                |
| JSON path query    | `jsonpath-plus`                        | JSONPath spec-compliant                         |
| CSV                | `papaparse`                            | Built-in streaming + `worker: true`             |
| YAML               | `js-yaml`                              | YAML 1.2 spec                                   |
| XML                | `fast-xml-parser`                      | **Phase 2**                                     |
| JWT                | `jose`                                 | Decode only, no signature verification          |
| Base64             | `js-base64`                            | Unicode-safe (native btoa fails on non-ASCII)   |
| URL encoding       | Native `encodeURIComponent`            | No library needed                               |
| Markdown           | `marked` + `dompurify`                 | Always sanitize before rendering. See ADR-0008. |
| Diff               | `diff`                                 | In-page panel, not a route                      |

---

## Route Structure

All routes are **flat** and **keyword-rich** for SEO/GEO optimization. No query params for state.

```
/                          Landing page — explains formatvault, links to all tools
/json-formatter            JSON format, validate, pretty-print, minify, JSONPath query
/csv-formatter             CSV format, validate, delimiter options, header detection
/yaml-formatter            YAML format, validate
/json-to-csv-converter     JSON → CSV
/json-to-yaml-converter    JSON → YAML
/csv-to-json-converter     CSV → JSON
/csv-to-yaml-converter     CSV → YAML
/yaml-to-json-converter    YAML → JSON
/yaml-to-csv-converter     YAML → CSV
/jwt-decoder               JWT decode (header + payload display, no verification)
/base64-encoder            Base64 encode/decode (Unicode-safe)
/url-encoder               URL encode/decode
/converters                Index page: links to all conversion pairs
/llms.txt                  AI crawler sitemap (GEO optimization)
```

**In-page panels (not routes):**

- **Diff viewer** — toggle panel on all formatter pages (compare two inputs side by side)
- **Markdown preview** — toggle panel where relevant (e.g., on JSON/YAML formatters)

**Deferred to Phase 2:**

- `/xml-formatter`
- `/xml-to-json-converter`
- `/json-to-xml-converter`

---

## Feature Matrix by Tool

### JSON Formatter (`/json-formatter`)

- [ ] Pretty-print (configurable indent: 2/4/8 spaces)
- [ ] Minify
- [ ] Sort keys
- [ ] Validate with error + line/column number
- [ ] Relaxed JSON support (json5 — trailing commas, comments)
- [ ] JSONPath querying (jsonpath-plus)
- [ ] Large file support (streaming parser + Web Worker)
- [ ] In-page diff panel
- [ ] Copy to clipboard
- [ ] Download as file
- [ ] Drag-and-drop file upload
- [ ] Keyboard shortcut: Cmd/Ctrl+Enter to format

### CSV Formatter (`/csv-formatter`)

- [ ] Format / normalize
- [ ] Validate (row/column consistency)
- [ ] Delimiter auto-detection (comma, tab, pipe, semicolon)
- [ ] Manual delimiter override
- [ ] Header row toggle
- [ ] Large file streaming (PapaParse `chunk` + `worker: true`)
- [ ] In-page diff panel
- [ ] Copy to clipboard
- [ ] Download as file
- [ ] Drag-and-drop file upload

### YAML Formatter (`/yaml-formatter`)

- [ ] Format (configurable indent: 2/4 spaces)
- [ ] Validate with line number
- [ ] Multi-document YAML support (`---` separator)
- [ ] Large file support (Web Worker)
- [ ] In-page diff panel
- [ ] In-page Markdown preview panel (YAML often contains markdown strings)
- [ ] Copy to clipboard
- [ ] Download as file
- [ ] Drag-and-drop file upload

### Converters

Each converter page is a focused single-purpose tool:

- [ ] Input editor (CodeMirror, source format syntax highlighting)
- [ ] Output editor (read-only, target format syntax highlighting)
- [ ] Convert button + Cmd/Ctrl+Enter shortcut
- [ ] Warning shown for lossy conversions (e.g., nested JSON → CSV)
- [ ] Copy + Download output
- [ ] File upload for input

### JWT Decoder (`/jwt-decoder`)

- [ ] Decode header (formatted JSON)
- [ ] Decode payload (formatted JSON)
- [ ] Show signature (raw)
- [ ] Show expiration (`exp` claim) in human-readable format
- [ ] "Token expired" warning if `exp` is past
- [ ] **Never** verify signature (insecure without secret; out of scope)
- [ ] Privacy notice: "Token processed locally, never sent to a server"

### Base64 Encoder (`/base64-encoder`)

- [ ] Encode string to Base64 (Unicode-safe)
- [ ] Decode Base64 to string
- [ ] Toggle: Encode / Decode
- [ ] Error on invalid Base64

### URL Encoder (`/url-encoder`)

- [ ] Encode string (encodeURIComponent)
- [ ] Decode string (decodeURIComponent)
- [ ] Toggle: Encode / Decode
- [ ] Error on malformed percent-encoding

---

## Large File Handling

See ADR-0009 for full details.

| Format           | Strategy                             | Practical Limit |
| ---------------- | ------------------------------------ | --------------- |
| CSV              | PapaParse streaming + `worker: true` | 500MB+          |
| JSON (streaming) | `@streamparser/json` in Web Worker   | 500MB+          |
| JSON (standard)  | `JSON.parse` in Web Worker           | ~50–100MB       |
| YAML             | `js-yaml` in Web Worker              | ~100MB          |

Hard cap: 500MB (enforced at file input). Files > 10MB show a progress bar.

---

## Data Persistence Policy

See ADR-0010 for full details.

| Data                          | Storage                              | Reason                       |
| ----------------------------- | ------------------------------------ | ---------------------------- |
| Theme, font size, indent size | `localStorage` via Zustand `persist` | Non-sensitive UI prefs       |
| Editor input content          | **Never persisted**                  | May contain credentials, PII |
| Editor output content         | **Never persisted**                  | Same reason                  |
| Conversion history            | **Never persisted**                  | Same reason                  |

User explicitly saves via Download button. A "Clear stored data" button in settings wipes localStorage.

---

## SEO / GEO Strategy

- **Individual routes per tool** — each route targets a specific search intent and is independently citable by AI systems (ChatGPT, Perplexity, Claude)
- **SSR meta tags** via React Router v7 `meta()` exports — each route has its own title, description, Open Graph, JSON-LD
- **`/llms.txt`** — AI crawler sitemap listing all tools with descriptions
- **No query params for state** — prevents duplicate content issues
- **Structured content per page** — H1, H2 sections ("How It Works", "Use Cases", "Examples") for AI extraction
- **`/converters` index page** — internal linking hub for all conversion pairs

---

## Security Summary

See ADRs 0007 and 0008 for full details.

| Control           | Implementation                                                |
| ----------------- | ------------------------------------------------------------- |
| XSS (Markdown)    | `DOMPurify.sanitize()` — always, no exceptions                |
| XSS (general)     | CSP headers: `script-src 'self' 'unsafe-inline'`              |
| Clickjacking      | `X-Frame-Options: DENY` + `frame-ancestors 'none'`            |
| HTTPS             | HSTS `max-age=31536000; includeSubDomains; preload`           |
| Data exfiltration | `connect-src 'self' https://plausible.io` — no other outbound |
| Supply chain      | `npm audit` monthly; Dependabot enabled                       |
| Input persistence | Never stored (see ADR-0010)                                   |

---

## Build Phases

### Phase 0 — Foundation

> Dev environment, tooling, testing framework

- [ ] 0.1 Init npm project (React 19, Vite, TypeScript)
- [ ] 0.2 TypeScript strict config (`@/` path alias)
- [ ] 0.3 Vite config (dev server, build optimization, code splitting)
- [ ] 0.4 ESLint + Prettier (flat config, jsx-a11y, prettier compat)
- [ ] 0.5 Husky + lint-staged (pre-commit hooks)
- [ ] 0.6 Base directory structure
- [ ] 0.7 Vitest + React Testing Library
- [ ] 0.8 Playwright E2E
- [ ] 0.9 GitHub Actions CI/CD → Cloudflare Pages deployment

### Phase 1 — App Shell

> Routing, state, layout, base UI

- [ ] 1.1 Tailwind CSS v4 + dark mode
- [ ] 1.2 Radix UI primitives + shadcn/ui components
- [ ] 1.3 React Router v7 framework mode + all routes (lazy-loaded)
- [ ] 1.4 Zustand stores (settingsStore persisted, editorStore in-memory)
- [ ] 1.5 Layout components (Header, Footer, SplitPane)
- [ ] 1.6 Placeholder page components (all routes)
- [ ] 1.7 App entry point + error boundaries + Suspense

### Phase 2 — Format Libraries + Core Logic

> Pure functions for parsing, formatting, converting

- [ ] 2.1 Install all format libraries
- [ ] 2.2 JSON formatter + validator (+ json5 relaxed mode)
- [ ] 2.3 CSV formatter + validator (PapaParse)
- [ ] 2.4 YAML formatter + validator (js-yaml)
- [ ] 2.5 All 6 conversion pairs (JSON↔CSV, JSON↔YAML, CSV↔YAML)
- [ ] 2.6 CodeMirror 6 `<CodeEditor>` component (lazy language packs)
- [ ] 2.7 JSON formatter UI (wired to 2.2 + 2.6)
- [ ] 2.8 CSV formatter UI (wired to 2.3 + 2.6)
- [ ] 2.9 YAML formatter UI (wired to 2.4 + 2.6)
- [ ] 2.10 All converter UIs (wired to 2.5 + 2.6)

### Phase 3 — Advanced Features

> File I/O, Web Workers, keyboard shortcuts, JSONPath

- [ ] 3.1 Web Worker + streaming parser infrastructure (`useFileParser` hook)
- [ ] 3.2 Drag-and-drop + file picker upload (all formatter pages)
- [ ] 3.3 Download as file (all output panes)
- [ ] 3.4 Copy to clipboard (`useCopyToClipboard` hook)
- [ ] 3.5 Keyboard shortcuts (`useKeyboardShortcuts` hook + help modal)
- [ ] 3.6 JSONPath querying (JSON formatter page)
- [ ] 3.7 In-page diff panel (all formatter pages)
- [ ] 3.8 Theme toggle with persistence

### Phase 4 — Additional Tools

> JWT, Base64, URL encoding, Markdown

- [ ] 4.1 JWT decoder (`/jwt-decoder`)
- [ ] 4.2 Base64 encoder/decoder (`/base64-encoder`)
- [ ] 4.3 URL encoder/decoder (`/url-encoder`)
- [ ] 4.4 Markdown preview (in-page panel — not a route)
- [ ] 4.5 `/converters` index page

### Phase 5 — Polish + Production

> Accessibility, SEO, deployment, documentation

- [ ] 5.1 WCAG 2.1 AA accessibility audit (axe-core + manual + screen reader)
- [ ] 5.2 SSR meta tags per route (title, description, OG, JSON-LD)
- [ ] 5.3 `/llms.txt` AI crawler sitemap
- [ ] 5.4 Plausible Analytics integration
- [ ] 5.5 Security headers (`_headers` file for Cloudflare Pages)
- [ ] 5.6 Loading states + spinners (for large files)
- [ ] 5.7 Error boundaries (per-route isolation)
- [ ] 5.8 Bundle optimization (Lighthouse > 90)
- [ ] 5.9 `robots.txt` + `sitemap.xml`
- [ ] 5.10 README + CONTRIBUTING.md
- [ ] 5.11 Landing page (`/`) — hero, feature cards, privacy statement

### Phase 6 — Phase 2 Formats (deferred)

> XML support

- [ ] 6.1 XML formatter + validator (`fast-xml-parser`)
- [ ] 6.2 XML↔JSON converter
- [ ] 6.3 `/xml-formatter`, `/xml-to-json-converter`, `/json-to-xml-converter` routes

---

## ADR Index

| ADR                                                             | Title                                     | Status   |
| --------------------------------------------------------------- | ----------------------------------------- | -------- |
| [ADR-0001](./adr/ADR-0001-client-side-only-architecture.md)     | Client-Side Only Architecture             | Accepted |
| [ADR-0002](./adr/ADR-0002-hosting-cloudflare-pages.md)          | Hosting on Cloudflare Pages + Workers     | Accepted |
| [ADR-0003](./adr/ADR-0003-routing-react-router-v7.md)           | Routing with React Router v7              | Accepted |
| [ADR-0004](./adr/ADR-0004-state-management-zustand.md)          | State Management with Zustand             | Accepted |
| [ADR-0005](./adr/ADR-0005-styling-tailwind-radix-shadcn.md)     | Styling with Tailwind + Radix + shadcn/ui | Accepted |
| [ADR-0006](./adr/ADR-0006-analytics-plausible.md)               | Analytics with Plausible                  | Accepted |
| [ADR-0007](./adr/ADR-0007-security-headers-csp.md)              | Security Headers and CSP                  | Accepted |
| [ADR-0008](./adr/ADR-0008-xss-prevention-dompurify.md)          | XSS Prevention with DOMPurify             | Accepted |
| [ADR-0009](./adr/ADR-0009-large-file-processing-web-workers.md) | Large File Processing with Web Workers    | Accepted |
| [ADR-0010](./adr/ADR-0010-localstorage-preferences-only.md)     | localStorage for Preferences Only         | Accepted |
| [ADR-0011](./adr/ADR-0011-code-editor-codemirror6.md)           | Code Editor with CodeMirror 6             | Accepted |
| [ADR-0012](./adr/ADR-0012-format-libraries.md)                  | Format Library Selection                  | Accepted |
