# ADR-0006: Analytics with Plausible

**Date:** 2026-02-22
**Status:** Accepted
**Deciders:** Greg Mahring

---

## Context

formatvault needs to understand which tools receive the most traffic to guide prioritization of new features and improvements. The app's core value proposition includes privacy ("no data leaves your browser"), which must extend to analytics — using Google Analytics or similar tracking would undermine this claim and create GDPR/CCPA compliance obligations.

## Decision

Use **Plausible Analytics** for privacy-respecting traffic tracking.

## Rationale

| Criterion          | Plausible          | Google Analytics 4         | Fathom       |
| ------------------ | ------------------ | -------------------------- | ------------ |
| Cookie required    | ✅ No              | ❌ Yes                     | ✅ No        |
| PII collected      | ✅ None            | ❌ IP, device fingerprint  | ✅ None      |
| GDPR compliant     | ✅ By design       | ⚠️ Requires consent banner | ✅ By design |
| Script size        | ✅ ~2KB            | ❌ ~45KB                   | ✅ ~2KB      |
| Page view tracking | ✅                 | ✅                         | ✅           |
| Per-route tracking | ✅                 | ✅                         | ✅           |
| Custom events      | ✅                 | ✅                         | ✅           |
| Open source        | ✅ (self-hostable) | ❌                         | ❌           |
| Cost               | $9/mo (10k pv)     | Free                       | $14/mo       |

Plausible tracks:

- Page views per route (critical: know which tools are most used)
- Referral sources (where users come from)
- Country / device type
- No user IDs, no sessions, no fingerprinting

This is exactly the data needed for prioritization decisions without any privacy trade-off.

## What We Track

- Page views per route (e.g., `/json-formatter` vs `/jwt-decoder` vs `/json-to-csv-converter`)
- Traffic sources (organic search, direct, referral)
- Custom events (optional): "formatted", "converted", "copied", "downloaded" — action-level usage, no content

## What We Explicitly Do Not Track

- User identity of any kind
- Content of user input/output
- Session continuity across visits
- Any PII

## Implementation

```html
<!-- index.html — 2KB, deferred, no cookies -->
<script defer data-domain="formatvault.com" src="https://plausible.io/js/script.js"></script>
```

For SPA navigation (React Router v7), Plausible automatically tracks route changes via the History API. No custom integration needed.

## Consequences

### Positive

- No cookie consent banner required (no cookies set)
- Privacy notice stays clean: "No personal data collected, including by our analytics"
- 2KB script has negligible performance impact
- Per-route traffic data informs roadmap decisions

### Negative

- $9/mo cost (trivial)
- Less granular than GA4 for complex funnel analysis (acceptable — we don't need funnels)
- Self-hosting is an option if Plausible's cloud is ever a concern

## SOC2 Implications

- Plausible is GDPR-compliant by design — no DPA required in most jurisdictions
- No user PII is processed — satisfies CC6 privacy principles
- Analytics data is aggregate only — no individual user tracking
- Plausible is SOC2 Type II certified (vendor risk satisfied)
- Privacy notice must state what Plausible collects (aggregate, anonymous page views only)
