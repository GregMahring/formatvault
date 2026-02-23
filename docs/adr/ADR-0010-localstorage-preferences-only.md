# ADR-0010: localStorage for Preferences Only — No User Data Persistence

**Date:** 2026-02-22
**Status:** Accepted
**Deciders:** Greg Mahring

---

## Context

formatvault users frequently paste sensitive content into the tool: API keys, database dumps, credentials in JSON config files, PII in CSV exports, etc. A decision is needed about whether to persist editor input across sessions for user convenience.

The competing concerns:

- **Convenience**: Saving the last input means users don't lose work on refresh
- **Security**: A malicious browser extension, shared computer, or XSS vulnerability could expose persisted content
- **SOC2**: Data minimization requires not storing what isn't necessary

## Decision

**`localStorage` is used exclusively for non-sensitive UI preferences.** User input (editor content) is **never** persisted by the application.

## What Is Persisted (localStorage)

```typescript
// settingsStore — persisted via Zustand persist middleware
{
  theme: 'dark' | 'light',         // UI preference
  editorFontSize: number,           // UI preference
  indentSize: 2 | 4 | 8,           // UI preference
  autoFormat: boolean,              // UI preference
}
```

**None of this data is sensitive.** If exfiltrated by a malicious extension, the attacker learns the user's preferred dark mode setting. This is an acceptable risk.

## What Is NOT Persisted

- Editor input content (JSON, CSV, YAML text)
- Editor output content
- File upload history
- Conversion history
- Any user-provided data

## Why Not Persist Editor Input

### Threat: Malicious Browser Extensions

Supply chain attacks against browser extensions are documented and increasing. An extension with content script access to `formatvault.com` can read all `localStorage` data silently. Storing a developer's editor history means storing their credentials, API keys, and PII from past sessions.

### Threat: Shared Computers

Developers working in shared environments (offices, labs, cloud desktops) may not clear browser data between sessions. Persisting editor content creates an unintended data store accessible to the next user.

### Threat: XSS

Even with strong CSP, a single XSS vulnerability (in a dependency, in a polyfill, in a third-party script) allows complete `localStorage` exfiltration.

### SOC2 Principle: Data Minimization

"Don't store what you don't need." The application has no legitimate need for input persistence — the benefit (convenience) does not outweigh the risk (credential exposure). Users who need persistence can save files explicitly via the Download button.

## User-Facing Controls

- **"Clear stored data"** button in settings — wipes all `localStorage` for the domain
- **Privacy notice** on the landing page and footer: "Your input is never saved. No data leaves your browser."
- **Download button** on every tool — explicit, user-initiated file saving

## Comparison of Storage Options Considered

| Storage                 | Persists?    | XSS Vulnerable?       | Recommendation                                      |
| ----------------------- | ------------ | --------------------- | --------------------------------------------------- |
| `localStorage`          | ✅ Permanent | ✅ Yes                | **Preferences only**                                |
| `sessionStorage`        | Tab-scoped   | ✅ Yes                | Not used (cleared on tab close anyway)              |
| `IndexedDB`             | ✅ Permanent | ✅ Yes                | Not used (same risks as localStorage, more complex) |
| In-memory (React state) | ❌ None      | ✅ Yes but immaterial | **Used for editor content**                         |
| `HttpOnly` Cookie       | Configurable | ❌ No                 | Not applicable (no backend)                         |

## Consequences

### Positive

- Strong security posture: nothing sensitive in localStorage
- SOC2 data minimization satisfied
- Privacy claim ("no data leaves your browser") is bolstered by "we don't even save it locally"
- Zero risk from XSS, extensions, or shared computers for user input data

### Negative

- User loses editor content on page refresh — mitigated by Download button and explicit save UX
- Some users will find this inconvenient — accepted trade-off, documented in UX

## SOC2 Implications

- SOC2 CC6 (Logical Access): No unauthorized access to stored user content — because there is no stored user content.
- SOC2 CC7 (System Operations): No data retention to manage, rotate, or protect.
- Audit response: "User input is processed in-memory only and discarded when the browser tab is closed. No user content is persisted."
