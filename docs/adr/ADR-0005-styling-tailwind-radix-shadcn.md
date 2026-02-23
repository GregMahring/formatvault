# ADR-0005: Styling with Tailwind CSS v4 + Radix UI + shadcn/ui

**Date:** 2026-02-22
**Status:** Accepted
**Deciders:** Greg Mahring

---

## Context

formatvault is a developer-facing tool. The UI must be:

- Clean, minimal, and professional — familiar to developers
- Dark mode by default (developer convention)
- Fully accessible (WCAG 2.1 AA minimum, per SOC2)
- Fast to build (prioritize DX without sacrificing quality)

Three decisions are bundled here as they are tightly coupled:

1. CSS methodology (Tailwind vs CSS Modules vs CSS-in-JS)
2. Component primitives (Radix UI vs Headless UI vs custom)
3. Component implementation (shadcn/ui vs a component library)

## Decisions

1. **CSS**: Tailwind CSS v4
2. **Accessible primitives**: Radix UI
3. **Component implementation**: shadcn/ui (components owned by the repo, not a dependency)

## Rationale

### Tailwind CSS v4

|                  | Tailwind v4               | CSS Modules    | styled-components |
| ---------------- | ------------------------- | -------------- | ----------------- |
| Runtime overhead | ✅ Zero                   | ✅ Zero        | ❌ Runtime cost   |
| Build speed      | ✅ Fastest (Oxide engine) | Fast           | Moderate          |
| Dark mode        | ✅ `dark:` variant        | Manual         | Theme provider    |
| Developer DX     | ✅ Co-located styles      | File-switching | ✅ Co-located     |
| Consistency      | ✅ Design system tokens   | Manual         | Theme-based       |

Tailwind v4's Oxide engine (Rust-based) is significantly faster than v3. The `dark:` variant system handles dark/light mode cleanly. Utility-first co-location with components reduces context-switching.

### Radix UI Primitives

Radix provides unstyled, fully accessible component primitives (Dialog, DropdownMenu, Tabs, Select, Tooltip, etc.) that handle:

- ARIA roles and attributes
- Keyboard navigation (arrow keys, Escape, Tab)
- Focus management and focus trapping
- Screen reader announcements

Building these from scratch is weeks of work. Radix is the industry standard for accessible React primitives.

### shadcn/ui

shadcn/ui is not a component library — it is a code generator that copies pre-built Tailwind + Radix components directly into the repo (`src/components/ui/`). This means:

- **Full ownership**: components are our code, not a dependency
- **Full customization**: modify any component without forking a library
- **No version lock-in**: components don't need updating via npm

Initial shadcn/ui components: `Button`, `Card`, `Tabs`, `Select`, `Tooltip`, `Dialog`, `DropdownMenu`, `Badge`, `Separator`.

## Design Direction

Target aesthetic: developer tools like **Warp terminal**, **Linear**, **Raycast** — clean, dark, monospace-friendly, no decorative UI chrome.

- **Default theme**: Dark (class on `<html class="dark">`)
- **Font**: System monospace for code, system sans-serif for UI
- **Color palette**: Neutral grays with a single accent (TBD — blue or violet)
- **Density**: Compact. Developers prefer information-dense UIs.

## Consequences

### Positive

- WCAG 2.1 AA accessibility covered by Radix primitives (keyboard nav, ARIA)
- shadcn components are customizable — design system evolution is unconstrained
- Tailwind v4 utility classes are fast to write and easy to review
- Dark mode is zero-config with Tailwind's `dark:` variant

### Negative

- Tailwind class verbosity can make JSX noisy — mitigated by `cn()` utility and component abstraction
- shadcn components must be maintained in-repo (no upstream automatic updates) — acceptable trade-off for full ownership
- Tailwind v4 may still have rough edges (monitor release status; fall back to v3 if blocking issues found)

## SOC2 Implications

- Radix accessibility primitives help meet WCAG 2.1 AA (SOC2 CC6 — accessibility as part of availability)
- Color contrast must meet AA ratios: 4.5:1 normal text, 3:1 large text — verified via `eslint-plugin-jsx-a11y` and manual audit
