# formatvault — Project Planning Reference

> **Status:** Living document — updated to reflect current build state as of 2026-03-23.
> Architecture decisions remain in `docs/adr/`. Changes to scope or architecture require a corresponding ADR update.

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
| TOML               | `@iarna/toml`                          | TOML v1.0                                       |
| SQL                | `sql-formatter`                        | Multi-dialect SQL formatting                    |
| XML                | `fast-xml-parser`                      | **Phase 6 — not yet built**                     |
| JWT                | `jose`                                 | Decode only, no signature verification          |
| Base64             | `js-base64`                            | Unicode-safe (native btoa fails on non-ASCII)   |
| URL encoding       | Native `encodeURIComponent`            | No library needed                               |
| Markdown           | `marked` + `dompurify`                 | Always sanitize before rendering. See ADR-0008. |
| Diff               | `diff`                                 | In-page panel, not a route                      |

---

## Route Structure

All routes are **flat** and **keyword-rich** for SEO/GEO optimization. No query params for state.

### Live routes

```
/                              Landing page — explains formatvault, links to all tools
/json-formatter                JSON format, validate, pretty-print, minify, JSONPath query
/csv-formatter                 CSV format, validate, delimiter options, header detection
/yaml-formatter                YAML format, validate, multi-document support
/toml-formatter                TOML format, validate
/sql-formatter                 SQL format, multi-dialect
/jwt-decoder                   JWT decode (header + payload display, no verification)
/base64-encoder                Base64 encode/decode (Unicode-safe)
/url-encoder                   URL encode/decode, query parameter parser
/regex-tester                  Regex pattern tester with match highlighting
/hash-generator                MD5, SHA-1, SHA-256, SHA-512 hash generation
/json-schema-generator         Generate JSON Schema from JSON input; validate JSON against schema
/number-base-converter         Convert numbers between binary, octal, decimal, hex
/color-picker                  Color format converter (HEX, RGB, HSL, HSB)
/unix-timestamp-converter      Unix timestamp ↔ human-readable datetime
/cron-expression-explainer     Parse and explain cron expressions, show next run times
/converters                    Index page: links to all conversion pairs
/json-to-csv-converter         JSON → CSV
/json-to-yaml-converter        JSON → YAML
/csv-to-json-converter         CSV → JSON
/csv-to-yaml-converter         CSV → YAML
/yaml-to-json-converter        YAML → JSON
/yaml-to-csv-converter         YAML → CSV
/json-to-typescript            JSON → TypeScript interface/type
/json-to-toml-converter        JSON → TOML
/toml-to-json-converter        TOML → JSON
/toml-to-yaml-converter        TOML → YAML
/yaml-to-toml-converter        YAML → TOML
```

### In-page panels (not routes)

- **Diff viewer** — toggle panel on all formatter pages
- **Markdown preview** — toggle panel on JSON, CSV, YAML formatters
- **Tree view** — toggle panel on JSON and YAML formatters

### Planned routes (not yet built)

```
/xml-formatter                 XML format, validate          (Phase 6)
/xml-to-json-converter         XML → JSON                    (Phase 6)
/json-to-xml-converter         JSON → XML                    (Phase 6)
/privacy                       Privacy policy                (Phase 7 — pre-launch blocker)
/about                         How it works, architecture    (Phase 7)
```

---

## Current Build Status

Phases 0–5 are functionally complete. The checklist below reflects known gaps.

### Phase 0 — Foundation ✅

- [x] 0.1 Init npm project (React 19, Vite, TypeScript)
- [x] 0.2 TypeScript strict config (`@/` path alias)
- [x] 0.3 Vite config (dev server, build optimization, code splitting)
- [x] 0.4 ESLint + Prettier (flat config, jsx-a11y, prettier compat)
- [x] 0.5 Husky + lint-staged (pre-commit hooks)
- [x] 0.6 Base directory structure
- [x] 0.7 Vitest + React Testing Library
- [x] 0.8 Playwright E2E
- [x] 0.9 GitHub Actions CI pipeline (type-check → lint → test → build)

### Phase 1 — App Shell ✅

- [x] 1.1 Tailwind CSS v4 + dark mode (class strategy, semantic token system)
- [x] 1.2 Radix UI primitives + shadcn/ui components
- [x] 1.3 React Router v7 framework mode + all routes (lazy-loaded)
- [x] 1.4 Zustand stores (settingsStore persisted, editorStore in-memory)
- [x] 1.5 Layout components (Header with nav dropdowns, Footer, SplitPane)
- [x] 1.6 All route components implemented (no placeholders remaining)
- [x] 1.7 App entry point + error boundaries + Suspense

### Phase 2 — Format Libraries + Core Logic ✅

- [x] 2.1 All format libraries installed
- [x] 2.2 JSON formatter + validator (+ json5 relaxed mode)
- [x] 2.3 CSV formatter + validator (PapaParse)
- [x] 2.4 YAML formatter + validator (js-yaml)
- [x] 2.5 All conversion pairs (JSON↔CSV, JSON↔YAML, CSV↔YAML, JSON→TS, JSON↔TOML, YAML↔TOML)
- [x] 2.6 CodeMirror 6 `<CodeEditor>` component (lazy language packs)
- [x] 2.7–2.10 All formatter and converter UIs wired up

### Phase 3 — Advanced Features ✅

- [x] 3.1 Web Worker + streaming parser infrastructure (`useFileParser` hook)
- [x] 3.2 Drag-and-drop + file picker upload (all formatter pages)
- [x] 3.3 Download as file (all output panes)
- [x] 3.4 Copy to clipboard (`useCopyToClipboard` hook)
- [x] 3.5 Keyboard shortcuts (`useKeyboardShortcuts` hook + help modal)
- [x] 3.6 JSONPath querying (JSON formatter page)
- [x] 3.7 In-page diff panel (all formatter pages)
- [x] 3.8 Theme toggle (dark/light) with persistence

### Phase 4 — Additional Tools ✅

- [x] 4.1 JWT decoder (`/jwt-decoder`)
- [x] 4.2 Base64 encoder/decoder (`/base64-encoder`)
- [x] 4.3 URL encoder/decoder (`/url-encoder`)
- [x] 4.4 Markdown preview (in-page panel)
- [x] 4.5 `/converters` index page
- [x] 4.6 TOML formatter (`/toml-formatter`) — beyond original scope
- [x] 4.7 SQL formatter (`/sql-formatter`) — beyond original scope
- [x] 4.8 Regex tester (`/regex-tester`) — beyond original scope
- [x] 4.9 Hash generator (`/hash-generator`) — beyond original scope
- [x] 4.10 JSON Schema generator (`/json-schema-generator`) — beyond original scope
- [x] 4.11 Number base converter (`/number-base-converter`) — beyond original scope
- [x] 4.12 Color picker/converter (`/color-picker`) — beyond original scope
- [x] 4.13 Unix timestamp converter (`/unix-timestamp-converter`) — beyond original scope
- [x] 4.14 CRON expression explainer (`/cron-expression-explainer`) — beyond original scope
- [x] 4.15 JSON → TypeScript converter (`/json-to-typescript`) — beyond original scope
- [x] 4.16 JSON↔TOML, YAML↔TOML converters — beyond original scope

### Phase 5 — Polish + Production (partial) ⚠️

- [x] 5.1 WCAG 2.1 AA accessibility audit + Lighthouse score ≥ 96
- [x] 5.2 SSR meta tags per route (title, description, OG)
- [x] 5.3 `/llms.txt` AI crawler sitemap (exists — needs update for new routes)
- [x] 5.4 Plausible Analytics integration
- [x] 5.5 Security headers (`_headers` file — HSTS, CSP, COEP, CORP)
- [x] 5.6 Loading states + progress bars (large files)
- [x] 5.7 Error boundaries (per-route isolation)
- [x] 5.8 Bundle optimization (Lighthouse ≥ 96)
- [x] 5.9 `robots.txt` + `sitemap.xml` (exists — needs update for new routes)
- [ ] 5.10 README + CONTRIBUTING.md
- [x] 5.11 Landing page (`/`) — hero, feature strip, tool cards, privacy statement
- [ ] 5.12 **Deploy step in CI/CD** — GitHub Actions pipeline validates but does not deploy
- [ ] 5.13 **JSON-LD structured data per route** — planned, not yet implemented
- [ ] 5.14 **OG image** — no `og-image.png` in `public/`

---

## Production Readiness — Outstanding Work

### Phase 7 — Launch Blockers 🚨

These must be resolved before the site goes live.

- [ ] **7.1 CI/CD deploy step** — Add `wrangler deploy` (or Cloudflare Pages integration) to `.github/workflows/ci.yml`. Currently the pipeline validates but never ships.
- [ ] **7.2 Update `sitemap.xml`** — Add all 15+ routes added beyond original plan (toml-formatter, sql-formatter, regex-tester, hash-generator, json-schema-generator, number-base-converter, color-picker, unix-timestamp-converter, cron-expression-explainer, json-to-typescript, json-to-toml-converter, toml-to-json-converter, toml-to-yaml-converter, yaml-to-toml-converter).
- [ ] **7.3 Update `llms.txt`** — Add same missing routes. Verify GitHub repository URL is correct.
- [ ] **7.4 Privacy policy page** (`/privacy`) — Legally required (GDPR, CCPA). For a client-side tool this is short and strong: no data received, no cookies, Plausible analytics explained.

### Phase 8 — SEO Content (highest leverage) 📈

The planning doc always called for "Structured content per page — H1, H2 sections ('How It Works', 'Use Cases', 'Examples') for AI extraction." This has not been built. It is the single highest-impact SEO task remaining.

Each tool page needs content sections **below the tool UI** (does not interfere with usability):

- **Why use a private [tool name]?** — captures security-conscious developers; directly attacks the incumbent's weakness
- **How it works** — explains client-side processing; builds trust
- **Common use cases** — keyword-rich phrases matching real search intent
- **FAQ** — long-tail queries ("Is my data safe?", "Does this work offline?", "What file size is supported?")

Priority order (highest search volume first):

- [ ] 8.1 `/json-formatter` content sections
- [ ] 8.2 `/jwt-decoder` content sections (high security-intent traffic)
- [ ] 8.3 `/csv-formatter` content sections
- [ ] 8.4 `/yaml-formatter` content sections
- [ ] 8.5 `/base64-encoder` content sections
- [ ] 8.6 All converter pages content sections
- [ ] 8.7 Remaining tool pages content sections

### Phase 9 — Trust & Brand 🔒

- [ ] **9.1 Meta titles — privacy angle** — Update all route meta titles to surface the privacy differentiator. "JSON Formatter & Validator" → "JSON Formatter — Private, No Upload, 100% Client-Side". Competitors don't own this keyword space.
- [ ] **9.2 `/about` page** — Explains the architecture, why client-side matters, who built it. Diagram of what happens vs. server-side tools. Converts skeptical developers.
- [ ] **9.3 JSON-LD structured data** — Add `SoftwareApplication` or `WebApplication` schema per route for rich results in Google.
- [ ] **9.4 OG image** — Create a branded `og-image.png` (1200×630) for social sharing. Currently missing from `public/`.
- [ ] **9.5 README** — Production-ready README covering purpose, local development, and contributing.

### Phase 10 — Error Monitoring & Observability

- [ ] **10.1 Error monitoring** — No runtime error visibility. Options: Cloudflare's native JS error tracking, or Sentry (free tier). Client-side only so no server errors, but silent JS failures in format processing are currently invisible.
- [ ] **10.2 Lighthouse audit to 100** — Currently 96. Remaining points are accessibility and best practices; audit each page.

### Phase 6 — XML Support (deferred, high SEO value) 📄

"XML formatter", "XML to JSON converter", and "JSON to XML converter" are high-volume search terms. This was always on the roadmap.

- [ ] 6.1 XML formatter + validator (`fast-xml-parser`) at `/xml-formatter`
- [ ] 6.2 XML → JSON converter at `/xml-to-json-converter`
- [ ] 6.3 JSON → XML converter at `/json-to-xml-converter`
- [ ] 6.4 Add XML routes to `sitemap.xml`, `llms.txt`, nav dropdowns

---

## SEO / GEO Strategy

- **Individual routes per tool** — each route targets a specific search intent and is independently citable by AI systems (ChatGPT, Perplexity, Claude)
- **Privacy-angle meta titles** — target the search terms incumbents don't own: "json formatter no upload", "jwt decoder client side", "csv formatter secure"
- **SSR meta tags** via React Router v7 `meta()` exports — each route has its own title, description, Open Graph, JSON-LD
- **`/llms.txt`** — AI crawler sitemap listing all tools with descriptions
- **No query params for state** — prevents duplicate content issues
- **Structured content per page** — H1, H2 sections ("How It Works", "Use Cases", "FAQ") for Google extraction and AI citation
- **`/converters` index page** — internal linking hub for all conversion pairs
- **`robots.txt`** — explicitly allows all crawlers including GPTBot, Claude-Web, Googlebot

---

## Data Persistence Policy

See ADR-0010 for full details.

| Data                          | Storage                              | Reason                       |
| ----------------------------- | ------------------------------------ | ---------------------------- |
| Theme, font size, indent size | `localStorage` via Zustand `persist` | Non-sensitive UI prefs       |
| Editor input content          | **Never persisted**                  | May contain credentials, PII |
| Editor output content         | **Never persisted**                  | Same reason                  |
| Conversion history            | **Never persisted**                  | Same reason                  |

---

## Security Summary

See ADRs 0007 and 0008 for full details.

| Control           | Implementation                                                |
| ----------------- | ------------------------------------------------------------- |
| XSS (Markdown)    | `DOMPurify.sanitize()` — always, no exceptions                |
| XSS (general)     | CSP: `script-src 'self' 'unsafe-inline'`                      |
| Clickjacking      | `X-Frame-Options: DENY` + `frame-ancestors 'none'`            |
| HTTPS             | HSTS `max-age=31536000; includeSubDomains; preload`           |
| Data exfiltration | `connect-src 'self' https://plausible.io` — no other outbound |
| Cross-origin      | COEP `require-corp`, COOP `same-origin`, CORP `same-origin`   |
| Supply chain      | `npm audit` monthly; Dependabot enabled                       |
| Input persistence | Never stored (see ADR-0010)                                   |

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
