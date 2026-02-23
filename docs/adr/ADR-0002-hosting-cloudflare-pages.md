# ADR-0002: Hosting on Cloudflare Pages + Workers

**Date:** 2026-02-22
**Status:** Accepted
**Deciders:** Greg Mahring

---

## Context

formatvault needs a hosting platform that supports:

1. Static asset delivery (SPA bundle: JS, CSS, HTML)
2. Light SSR via server functions (meta tag injection for SEO — no user data processed)
3. Strong security defaults (DDoS, WAF, TLS)
4. Edge caching for performance
5. Cost efficiency at scale
6. Simple GitHub-integrated CI/CD

Platforms evaluated: Vercel, Netlify, Cloudflare Pages + Workers, Fly.io, Railway.

## Decision

Host on **Cloudflare Pages** (static assets + SPA) with **Cloudflare Pages Functions** (Node.js, for SSR meta tag injection).

## Rationale

| Dimension       | Cloudflare                          | Vercel         | Netlify               |
| --------------- | ----------------------------------- | -------------- | --------------------- |
| Cold starts     | ✅ None (<5ms, V8 isolates)         | ⚠️ 120–150ms   | ⚠️ 200–250ms          |
| Cost at scale   | ✅ $5–20/mo                         | ❌ $50–100+/mo | ⚠️ $19–30/mo          |
| DDoS/Security   | ✅ Industry-leading, <3s mitigation | Good           | Good                  |
| Edge locations  | ✅ 300+                             | ~100           | Moderate              |
| Edge cache TTL  | ✅ 15-day default                   | Configurable   | Configurable          |
| SSR support     | ✅ Pages Functions (Node.js)        | ✅ Native      | ⚠️ Deno (less mature) |
| Deployment ease | ⚠️ Slight manual config             | ✅ Zero-config | ✅ Zero-config        |

**Key architectural advantage:** Cloudflare Workers use V8 isolates (the same engine as Chrome) rather than containers. This means zero cold starts — SSR meta tag rendering happens in <5ms globally, compared to 120–250ms for container-based competitors.

**Cost model advantage:** Cloudflare charges for actual CPU time consumed. A lightweight SSR function that injects meta tags uses milliseconds of CPU. At scale, this is 10–20x cheaper than Vercel's GB-hour model.

**Security advantage:** Cloudflare's DDoS mitigation is architectural (not bolt-on), and WAF with ML-powered zero-day detection is included at the paid tier ($5/mo minimum). For a developer tool that will be publicly indexed and linked from many sources, robust DDoS protection is important.

## Deployment Architecture

```
GitHub push → GitHub Actions (CI: type-check, lint, test) → wrangler deploy
                                                              ↓
                                                    Cloudflare Pages
                                                    ├── Static assets (JS, CSS, HTML)
                                                    │   └── Cached at 300+ edge locations
                                                    └── Pages Functions (SSR)
                                                        └── Meta tag injection per route
                                                            (no user data, no logging)
```

## Consequences

### Positive

- Best performance/cost ratio of all evaluated platforms
- Security is default-on, not an add-on
- `wrangler` CLI integrates cleanly with GitHub Actions
- Cloudflare Nameservers required (but DNS management is excellent)
- Future: Cloudflare KV, D1, R2 available if backend features are ever added

### Negative

- Requires Cloudflare nameservers (minor: means Cloudflare manages DNS)
- Pages Functions use a Node.js subset — not full Node. Sufficient for meta tag SSR but not a full Express app
- Slightly more configuration than Vercel's zero-config (manageable)

## Alternatives Considered

### Vercel

Good product, excellent DX, but 10x more expensive at scale. Cold starts (120–150ms) create measurable latency for SSR requests. Rejected on cost and performance grounds.

### Netlify

Solid option. Edge Functions run on Deno (non-standard, less ecosystem support). Cold starts are the worst of the evaluated options (200–250ms AWS Lambda backend). Rejected.

### Fly.io / Railway

Full container hosting — appropriate for full-stack apps with real backends. Overkill for this use case. No built-in CDN or edge caching. Rejected.

## SOC2 Implications

- Cloudflare Pages Functions must **never log user input** (data never reaches the server in our architecture, but this must be enforced in code review).
- Security headers enforced at edge (see ADR-0007).
- TLS 1.3 is default on Cloudflare — no configuration required.
- Cloudflare is SOC2 Type II certified, which satisfies vendor risk management requirements.
