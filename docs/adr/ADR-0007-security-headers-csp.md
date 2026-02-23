# ADR-0007: Security Headers and Content Security Policy

**Date:** 2026-02-22
**Status:** Accepted
**Deciders:** Greg Mahring

---

## Context

formatvault renders user-provided content in the browser (JSON, CSV, YAML, Markdown). The Markdown preview feature in particular renders user input as HTML, creating an XSS attack surface. Additionally, as a developer tool, formatvault will be linked from many external sources and may become a target for abuse.

Defense-in-depth requires both application-level sanitization (DOMPurify) and HTTP-level security headers.

## Decision

Enforce the following security headers via Cloudflare Pages configuration, applied to all responses.

## Security Headers

```
# _headers file for Cloudflare Pages
/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self' https://plausible.io; worker-src 'self' blob:; frame-ancestors 'none';
  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

## CSP Rationale

| Directive         | Value                         | Reason                                                                      |
| ----------------- | ----------------------------- | --------------------------------------------------------------------------- |
| `default-src`     | `'self'`                      | Deny all unlisted sources by default                                        |
| `script-src`      | `'self' 'unsafe-inline'`      | Tailwind v4 requires inline styles; React hydration may need inline scripts |
| `style-src`       | `'self' 'unsafe-inline'`      | Tailwind utility classes generate inline styles                             |
| `img-src`         | `'self' data: blob:`          | `data:` for base64 images; `blob:` for file download URLs                   |
| `connect-src`     | `'self' https://plausible.io` | Allow only Plausible analytics outbound                                     |
| `worker-src`      | `'self' blob:`                | Web Workers loaded from Vite bundles use blob: URLs                         |
| `frame-ancestors` | `'none'`                      | Prevent clickjacking — equivalent to X-Frame-Options: DENY                  |

**Note on `'unsafe-inline'`:** Tailwind CSS v4 and React's inline style hydration require `unsafe-inline` for both script and style. This is a known trade-off for Tailwind-based SPAs. Mitigation: strict DOMPurify sanitization (see ADR-0008) reduces XSS risk at the application layer. A nonce-based CSP would be ideal but requires SSR nonce injection on every request — deferred as a future hardening step.

## XSS Prevention at Application Layer

HTTP headers are defense-in-depth. Primary XSS prevention:

1. **Markdown preview**: Always sanitize with `DOMPurify.sanitize()` before `dangerouslySetInnerHTML`.
2. **User input**: Never rendered as raw HTML outside of the CodeMirror editor (which escapes content by design).
3. **Error messages**: Never include user-submitted content in error displays.
4. **URL params**: Never rendered as raw HTML.

## Consequences

### Positive

- Prevents clickjacking (X-Frame-Options + frame-ancestors)
- Prevents MIME sniffing attacks
- Limits outbound connections to known good destinations (CSP connect-src)
- HSTS with preload ensures HTTPS is enforced at browser level
- Permissions-Policy prevents abuse of camera/mic/geolocation APIs

### Negative

- `unsafe-inline` weakens CSP's XSS protection — mitigated by DOMPurify and lack of server-side rendering of user content
- Adding new external resources (CDN, font service, etc.) requires updating CSP — acceptable operational overhead

## Future Hardening

- Implement nonce-based CSP when SSR infrastructure allows per-request nonce injection
- Add `require-trusted-types-for 'script'` once Trusted Types browser support is sufficient
- Submit domain to HSTS preload list after stable deployment

## SOC2 Implications

- Security headers directly address CC6 (Logical Access) and CC7 (System Operations) controls
- CSP prevents unauthorized script execution (supply chain / XSS attacks)
- HSTS ensures all data in transit is encrypted
- X-Frame-Options prevents UI redressing attacks
- These headers will be verified in security audits
