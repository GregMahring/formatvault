# ADR-0001: Client-Side Only Architecture

**Date:** 2026-02-22
**Status:** Accepted
**Deciders:** Greg Mahring

---

## Context

formatvault is a developer tool for formatting, validating, and converting data formats (JSON, CSV, YAML, and others). A fundamental architectural decision is whether to process data on the server or entirely in the browser.

The primary concern is **data sensitivity**: developers frequently paste API keys, credentials, database dumps, PII, and other sensitive content into formatter/converter tools during debugging workflows. Any server-side processing creates a data exfiltration risk and a trust problem.

## Decision

All data processing (formatting, validation, conversion, encoding, decoding) happens **100% client-side** in the browser. No user input is ever transmitted to a server.

The only server component is a lightweight SSR layer (Cloudflare Pages Functions) responsible solely for injecting route-specific `<head>` content (title, meta tags, Open Graph, JSON-LD structured data) for SEO/GEO purposes. This SSR layer never receives, processes, or logs any user data.

## Consequences

### Positive

- **Trust**: "No data leaves your browser" is a genuine, verifiable claim — not marketing copy. Developers can confirm this by inspecting network requests.
- **Privacy by design**: No data retention, no breach risk, no GDPR/CCPA exposure for user content.
- **SOC2 simplification**: Without server-side data handling, the compliance surface area is dramatically reduced. No data storage, no data access controls, no audit logging of user content required.
- **Operational simplicity**: No database, no backend API, no data encryption at rest required.
- **Scalability**: Static assets + edge functions scale to any traffic volume with zero per-request compute cost for the main application logic.
- **Performance**: Zero network round-trip for data processing. Large files processed locally at memory bandwidth speeds.

### Negative

- **File size constraints**: Browser memory limits apply. Mitigated by Web Workers and streaming parsers (see ADR-0009).
- **No server-side validation**: Cannot reject malicious payloads before they reach the browser. Mitigated by strict Content Security Policy (see ADR-0007).
- **No persistent user accounts**: Cannot save user preferences or history server-side. UI preferences only are persisted to `localStorage` (non-sensitive). User data is never persisted (see ADR-0010).
- **Limited analytics**: Cannot server-log usage patterns. Mitigated by Plausible Analytics (privacy-respecting, client-side, see ADR-0006).

## Alternatives Considered

### Server-Side Processing

Rejected. Introduces a data trust problem that is fundamental and hard to overcome — users must trust that the server doesn't log their content. Adds operational complexity (database, encryption at rest, audit logging, GDPR compliance for user data) with no meaningful benefit for this use case.

### Hybrid (client-side with optional server enhancement)

Rejected for initial architecture. The complexity cost is not justified. Architecture is designed to remain extensible if a backend is ever added (e.g., for saved presets, team features), but that is deferred indefinitely.

## SOC2 Implications

This decision is the single most impactful SOC2 decision in the project. By never touching user data server-side:

- **CC6 (Logical Access)**: No user data to protect server-side.
- **CC7 (System Operations)**: No data processing pipeline to monitor.
- **A1 (Availability)**: Static hosting is inherently highly available.
- Privacy criteria are trivially satisfied for user-submitted content.
