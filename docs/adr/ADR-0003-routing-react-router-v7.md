# ADR-0003: Routing with React Router v7 (Framework Mode)

**Date:** 2026-02-22
**Status:** Accepted
**Deciders:** Greg Mahring

---

## Context

formatvault requires a routing solution for ~20 static routes with the following requirements:

- TypeScript strict mode compatibility
- SSR support for meta tag injection (SEO/GEO) without custom Express boilerplate
- React 19 compatibility
- Clean URL structure (flat, keyword-rich routes)
- Search param handling for potential shareable state
- Vite integration

Routers evaluated: React Router v7 (framework mode), TanStack Router v1.

## Decision

Use **React Router v7 in framework mode** (formerly Remix, merged as of v7).

## Rationale

| Criterion             | TanStack Router         | React Router v7       | Winner    |
| --------------------- | ----------------------- | --------------------- | --------- |
| TypeScript safety     | 10/10                   | 8/10 (framework mode) | TanStack  |
| SSR / meta tags       | Custom Express required | ✅ Built-in           | **RR v7** |
| Bundle size           | ~27KB gz                | Leaner                | **RR v7** |
| Ecosystem / community | 1M downloads/wk         | 16.6M downloads/wk    | **RR v7** |
| Search params         | 10/10 native            | 6/10 (Zod mitigates)  | TanStack  |
| File-based routing    | ✅ Excellent            | ✅ Excellent          | Tie       |
| DevTools              | ✅ Dedicated panel      | Browser DevTools only | TanStack  |
| Long-term maintenance | 8/10                    | 9/10                  | **RR v7** |
| **Score**             | 78/100                  | **79/100**            | **RR v7** |

**The deciding factor is SSR.** React Router v7 framework mode provides built-in SSR with route-level `meta()` exports — no custom server required. Each route exports its own meta tags:

```typescript
// src/routes/json-formatter.tsx
export function meta() {
  return [
    { title: 'JSON Formatter & Validator — formatvault' },
    { name: 'description', content: 'Free, privacy-first JSON formatter...' },
    { property: 'og:title', content: 'JSON Formatter & Validator' },
  ];
}
```

This replaces what would otherwise require a custom Express server + `react-helmet-async` wiring. The reduction in boilerplate is significant.

**TypeScript trade-off:** TanStack's search param type safety is genuinely superior. This is mitigated with Zod validation at the route boundary:

```typescript
import { z } from 'zod';
const SearchSchema = z.object({ theme: z.enum(['light', 'dark']).optional() });
const params = SearchSchema.parse(Object.fromEntries(new URLSearchParams(location.search)));
```

This is a 5-line utility, not a fundamental architectural gap.

## URL Structure

Following SEO/GEO best practices (flat, keyword-rich, individual routes per tool):

```
/                          — Landing page
/json-formatter            — JSON format + validate + query
/csv-formatter             — CSV format + validate
/yaml-formatter            — YAML format + validate
/json-to-csv-converter     — JSON → CSV conversion
/json-to-yaml-converter    — JSON → YAML conversion
/csv-to-json-converter     — CSV → JSON conversion
/csv-to-yaml-converter     — CSV → YAML conversion
/yaml-to-json-converter    — YAML → JSON conversion
/yaml-to-csv-converter     — YAML → CSV conversion
/jwt-decoder               — JWT decode (no signature verification)
/base64-encoder            — Base64 encode/decode
/url-encoder               — URL encode/decode
/converters                — Index: all conversion pairs
/llms.txt                  — AI crawler sitemap (GEO)
```

**Note:** Diff viewer and Markdown preview are **not** standalone routes. They are in-page panel options within the relevant formatter pages (diff on any formatter, markdown preview on the markdown/YAML pages). This provides a cleaner UX — these are modes/views, not destinations.

**No query params for state.** Query params create duplicate content issues and fragment SEO signals. If shareable links are ever needed, a short hash ID approach will be used (future enhancement).

## File Structure

```
src/
└── routes/
    ├── _index.tsx                  (/)
    ├── json-formatter.tsx          (/json-formatter)
    ├── csv-formatter.tsx           (/csv-formatter)
    ├── yaml-formatter.tsx          (/yaml-formatter)
    ├── json-to-csv-converter.tsx   (/json-to-csv-converter)
    ├── json-to-yaml-converter.tsx  (/json-to-yaml-converter)
    ├── csv-to-json-converter.tsx   (/csv-to-json-converter)
    ├── csv-to-yaml-converter.tsx   (/csv-to-yaml-converter)
    ├── yaml-to-json-converter.tsx  (/yaml-to-json-converter)
    ├── yaml-to-csv-converter.tsx   (/yaml-to-csv-converter)
    ├── jwt-decoder.tsx             (/jwt-decoder)
    ├── base64-encoder.tsx          (/base64-encoder)
    ├── url-encoder.tsx             (/url-encoder)
    ├── converters.tsx              (/converters)
    └── $.tsx                       (404 catch-all)
```

## Consequences

### Positive

- SSR meta tags per route with zero custom server code
- File-based routing via `@react-router/fs-routes` Vite plugin
- Automatic code splitting per route (each route is its own JS chunk)
- Strong TypeScript in framework mode
- Largest router ecosystem — most tutorials, Stack Overflow coverage

### Negative

- Framework mode is more opinionated than library mode (acceptable trade-off)
- Search param type safety requires Zod (minor boilerplate)
- TanStack's DevTools are better (live with browser DevTools for now)

## Alternatives Considered

### TanStack Router v1

Excellent TypeScript story. Superior search param handling and DevTools. Rejected because SSR requires custom Express integration — the operational complexity is not worth it given React Router v7's built-in solution.

## SOC2 Implications

- Route-level meta tags must not include user-submitted content (XSS risk).
- SSR route handlers must never log request bodies or query params (data privacy).
- 404 handler must return a safe, non-leaky error page.
