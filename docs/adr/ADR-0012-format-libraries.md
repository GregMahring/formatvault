# ADR-0012: Format Library Selection

**Date:** 2026-02-22
**Status:** Accepted
**Deciders:** Greg Mahring

---

## Context

formatvault requires libraries for parsing, formatting, validating, and converting between data formats. Libraries must be:

- Well-maintained with active security patching
- Strong TypeScript support
- Appropriate bundle size (tree-shakeable preferred)
- Accurate to the relevant specification

## Decisions

| Format/Feature                    | Library                                            | Version  | Justification                                                                  |
| --------------------------------- | -------------------------------------------------- | -------- | ------------------------------------------------------------------------------ |
| **JSON (standard)**               | Native `JSON.parse` / `JSON.stringify`             | Built-in | Zero cost, spec-compliant, fastest                                             |
| **JSON (relaxed)**                | `json5`                                            | ^2.2.3   | Handles trailing commas, comments — common in developer workflows              |
| **JSON (streaming, large files)** | `@streamparser/json`                               | ^3.0.0   | Only streaming JSON parser for browsers; see ADR-0009                          |
| **JSON path querying**            | `jsonpath-plus`                                    | ^10.0.0  | Pure JS, good TypeScript types, JSONPath spec-compliant                        |
| **CSV**                           | `papaparse`                                        | ^5.4.1   | De-facto standard; built-in streaming; delimiter auto-detection; battle-tested |
| **YAML**                          | `js-yaml`                                          | ^4.1.0   | De-facto standard for YAML 1.2; excellent error messages; stable               |
| **XML**                           | `fast-xml-parser`                                  | ^4.3.6   | Deferred to Phase 2. Bidirectional XML↔JSON; fast; maintained                  |
| **JWT decoding**                  | `jose`                                             | ^5.9.0   | Modern, secure, supports JOSE standards; no crypto polyfills needed            |
| **Base64**                        | `js-base64`                                        | ^3.7.5   | Handles Unicode correctly (native `btoa`/`atob` fail on non-ASCII)             |
| **URL encoding**                  | Native `encodeURIComponent` / `decodeURIComponent` | Built-in | No library needed                                                              |
| **Markdown**                      | `marked`                                           | ^14.0.0  | Fast, GFM-compliant; always paired with DOMPurify (see ADR-0008)               |
| **HTML sanitization**             | `dompurify`                                        | ^3.2.0   | Industry standard; used by Google, GitHub; see ADR-0008                        |
| **Diff computation**              | `diff`                                             | ^7.0.0   | Pure JS diff library; used as in-page panel feature (not a route)              |
| **JavaScript / TypeScript**       | `prettier` (standalone build)                      | ^3.9.8   | Industry-standard output; pure JS (no WASM, no `eval`), so no CSP change       |
| **JavaScript minification**       | `terser`                                           | ^5.51.2  | Minifier behind Vite/webpack/Rollup builds; pure JS (no WASM, no `eval`)       |
| **CSS minification**              | `lightningcss-wasm`                                | ^1.33.0  | Only browser-capable minifier tested that preserves native CSS nesting         |

### Amendment (2026-09-23): JavaScript formatter

`prettier` was added for `/javascript-formatter`. Its standalone build plus a parser is ~175 KB gzipped with Babel or ~215 KB with TypeScript, too large for the route chunk, so it is dynamically imported inside `src/workers/jsFormatter.worker.ts` on first use. It always runs in the worker, regardless of input size (a departure from ADR-0009's 1 MB threshold), because formatting cost is unpredictable. Pure-JS formatters and minifiers are preferred over WASM builds (esbuild-wasm, swc) because WASM would require adding `'wasm-unsafe-eval'` to the CSP (ADR-0007). User code is parsed, never executed. `prettier` moved from `devDependencies` to `dependencies`; the same package also formats this repo, so version bumps affect both.

### Amendment (2026-09-30): JavaScript minifier

`terser` was added for `/javascript-minifier`. Like Prettier it is dynamically imported inside its own worker (`src/workers/jsMinifier.worker.ts`, ~145 KB gzipped on first use) and always runs there. Both JS workers share one request protocol (`src/workers/workerRequest.ts`) and one main-thread hook (`src/hooks/useLatestWorkerRequest.ts`) that discards superseded results. terser parses standard JavaScript only — TypeScript and JSX are rejected with a parse error. Gzipped sizes shown in the UI are computed with the native `CompressionStream` API and omitted where it is unavailable.

### Amendment (2026-09-30): CSS minifier

`lightningcss-wasm` was chosen for `/css-minifier` after the pure-JS candidates failed a correctness test: **csso 5 and clean-css 5 both silently delete native nested rules** (`.card { &:hover { … } }` minifies to `.card{…}` with the hover rule gone), and both are unmaintained since 2023. clean-css also depends on Node built-ins. csso's error-tolerant parser additionally turned invalid input into empty output without an error. lightningcss preserves nesting and modern syntax, merges duplicate rules, and throws located `SyntaxError`s for invalid CSS (shown with Rust token names stripped).

Trade-offs accepted: a ~3.8 MB gzipped (15.8 MB raw) WASM download on first use, cached immutably afterwards; it is loaded and compiled only inside `src/workers/cssMinifier.worker.ts`. WASM requires `'wasm-unsafe-eval'` in `script-src` — see the ADR-0007 amendment. The engine is given an explicit `?url` asset URL because Vite's dependency pre-bundling breaks the package's own `import.meta.url` lookup. Unit tests run the real engine under Vitest's Node environment; jsdom's cross-realm `Uint8Array`s are rejected by its WASM bindings.

## Format Feature Matrix

| Format       | Formatter        | Validator      | Pretty Print | Minify  | Query/Filter  | In-page diff | Notes                     |
| ------------ | ---------------- | -------------- | ------------ | ------- | ------------- | ------------ | ------------------------- |
| **JSON**     | ✅               | ✅             | ✅           | ✅      | ✅ (JSONPath) | ✅           | json5 for relaxed parsing |
| **CSV**      | ✅               | ✅             | ✅           | —       | —             | ✅           | PapaParse streaming       |
| **YAML**     | ✅               | ✅             | ✅           | —       | —             | ✅           |                           |
| **XML**      | Phase 2          | Phase 2        | Phase 2      | Phase 2 | —             | Phase 2      | fast-xml-parser           |
| **JWT**      | Decode only      | ✅ (structure) | ✅           | —       | —             | —            | No signature verification |
| **Base64**   | ✅ encode/decode | —              | —            | —       | —             | —            | Unicode-safe              |
| **URL**      | ✅ encode/decode | —              | —            | —       | —             | —            | Native APIs               |
| **Markdown** | → HTML           | —              | Preview      | —       | —             | —            | DOMPurify required        |
| **CSS**      | —                | ✅ (syntax)    | —            | ✅      | —             | ✅           | lightningcss WASM worker  |
| **JS / TS**  | ✅               | ✅ (syntax)    | ✅           | ✅ (JS) | —             | ✅           | Prettier / terser workers |

## In-Page Features (Not Routes)

**Diff Viewer** and **Markdown Preview** are implemented as in-page panel options, not dedicated routes:

- Diff: Available as a toggle panel on all formatter pages (compare two inputs)
- Markdown Preview: Available as a panel option on the YAML formatter (YAML often contains markdown fields) and as a dedicated tool on the `/markdown-preview` route... wait — per final decision, Markdown preview is also an in-page option, not a standalone route.

This is better UX — these are modes/views, not destinations. No dedicated route exists for either.

## Conversion Matrix

All conversions are bidirectional. Complex conversions route through an intermediate format:

```
JSON ←──────────────────────► CSV   (papaparse + JSON.stringify)
JSON ←──────────────────────► YAML  (js-yaml + JSON.parse)
CSV  ←── via JSON ───────────► YAML
XML  ←──────────────────────► JSON  (Phase 2: fast-xml-parser)
```

Lossy conversions (e.g., nested JSON objects → CSV) display a warning in the UI.

## Security Considerations

- `npm audit` runs monthly; high/critical vulnerabilities are patched within 48 hours
- All libraries are evaluated before adding: license, maintenance status, download count, known vulnerabilities
- `@streamparser/json`, `dompurify`, and `marked` versions are pinned (not ranges) in production to prevent supply chain drift
- No libraries with server-side execution are used in client-side parsing paths

## Consequences

### Positive

- Native APIs (URL encoding, standard JSON) used where possible — zero bundle cost
- Libraries chosen for ecosystem dominance (papaparse, js-yaml) — well-maintained, widely audited
- Streaming support (papaparse, @streamparser/json) handles large files without UI freezing

### Negative

- `papaparse` has no TypeScript types in the main package — requires `@types/papaparse`
- `@streamparser/json` is less widely known than alternatives — monitor maintenance
- `marked` v14+ changed API — ensure compatibility with current version before pinning

## SOC2 Implications

- All format libraries operate entirely client-side — consistent with ADR-0001
- Library vulnerabilities are monitored via `npm audit` and GitHub Dependabot
- No library processes user data server-side — no PII logging risk at library layer
