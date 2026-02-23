# formatvault — Claude Code Configuration

## Project Overview

formatvault is a TypeScript/React/Vite web application. This file provides essential context for Claude Code agents working in this repository.

## Technology Stack

- **Language**: TypeScript 5.x with strict mode (`strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`)
- **UI**: React 19 (function components, hooks — no class components)
- **Build**: Vite (latest stable) + `@vitejs/plugin-react-swc`
- **Router**: React Router v7 (framework mode — built-in SSR for meta tags/SEO)
- **Testing**: Vitest + React Testing Library for unit/component tests; Playwright for E2E
- **Styling**: Tailwind CSS v4 (dark mode default via `class` strategy)
- **Components**: Radix UI primitives + shadcn/ui (components owned in `src/components/ui/`)
- **State Management**: Zustand v5 — preferences only to `localStorage`; editor content in-memory only (never persisted)
- **Code Editor**: CodeMirror 6 via `@uiw/react-codemirror` (language packs lazy-loaded per route)
- **Hosting**: Cloudflare Pages + Workers (SSR via Pages Functions)
- **Analytics**: Plausible (privacy-respecting, no cookies, per-route traffic)

## Key Architectural Decisions

All decisions are documented in `docs/adr/`. The most critical ones to understand:

- **Client-side only** (ADR-0001): All data processing happens in the browser. No user data ever transmitted.
- **No input persistence** (ADR-0010): Editor content is NEVER saved to localStorage. Preferences only.
- **XSS prevention** (ADR-0008): All user content rendered as HTML MUST use `DOMPurify.sanitize()`. No exceptions.
- **Large files** (ADR-0009): Files >1MB are processed in Web Workers using streaming parsers.
- **Security headers** (ADR-0007): Enforced via Cloudflare Pages `_headers` file.

## Format Libraries

| Format                   | Library                                  |
| ------------------------ | ---------------------------------------- |
| JSON (standard)          | Native `JSON.parse` / `JSON.stringify`   |
| JSON (relaxed)           | `json5`                                  |
| JSON (large files, ≥5MB) | `@streamparser/json` (streaming)         |
| JSON path querying       | `jsonpath-plus`                          |
| CSV                      | `papaparse` (streaming + `worker: true`) |
| YAML                     | `js-yaml`                                |
| XML                      | `fast-xml-parser` (Phase 2)              |
| JWT                      | `jose` (decode only, no verification)    |
| Base64                   | `js-base64` (Unicode-safe)               |
| URL encoding             | Native `encodeURIComponent`              |
| Markdown                 | `marked` + `dompurify` (always sanitize) |

## Route Structure

Flat, keyword-rich URLs for SEO/GEO. See `docs/PLANNING.md` for full route list.

- Formatter routes: `/json-formatter`, `/csv-formatter`, `/yaml-formatter`
- Converter routes: `/json-to-csv-converter`, `/json-to-yaml-converter`, etc. (one route per conversion pair)
- Tool routes: `/jwt-decoder`, `/base64-encoder`, `/url-encoder`
- **Diff viewer** and **Markdown preview** are in-page panel options — NOT separate routes
- No query params for user state (SEO: prevents duplicate content)

## Repository Layout

```
formatvault/
├── src/
│   ├── components/     # Shared UI components (including shadcn/ui in components/ui/)
│   ├── features/       # Feature-specific modules (co-located tests)
│   │   ├── json/       # JSON formatter, validator, query logic
│   │   ├── csv/        # CSV formatter, validator
│   │   ├── yaml/       # YAML formatter, validator
│   │   ├── convert/    # All conversion pair logic
│   │   └── tools/      # JWT, Base64, URL encoding utilities
│   ├── hooks/          # Shared React hooks (useFileParser, useCopyToClipboard, etc.)
│   ├── lib/            # Pure utilities, no React
│   ├── routes/         # React Router v7 file-based routes (replaces pages/)
│   ├── stores/         # Zustand stores (settingsStore, editorStore)
│   ├── workers/        # Web Worker files (fileParser.worker.ts)
│   └── types/          # Shared TypeScript types
├── docs/
│   ├── PLANNING.md     # Project planning reference (authoritative)
│   └── adr/            # Architecture Decision Records (ADR-NNNN-kebab-title.md)
├── e2e/                # Playwright end-to-end tests
├── public/             # Static assets (favicon, og-image, robots.txt, llms.txt)
└── .claude/
    ├── agents/         # Project-specific Claude sub-agents
    └── skills/         # Project-specific Claude slash-commands
```

## Coding Conventions

- **File naming**: `PascalCase.tsx` for React components, `camelCase.ts` for utilities
- **Exports**: Named exports preferred. Default exports only for pages/routes.
- **Props interfaces**: Named `<ComponentName>Props`, exported alongside the component
- **Error handling**: Never swallow errors silently. Log with context. Surface to the user where appropriate.
- **Comments**: Explain WHY, not WHAT. Code should be self-documenting. Avoid obvious comments.

## SOC2 Constraints

This project operates under SOC2 compliance requirements. All agents must:

- **NEVER** commit secrets, tokens, API keys, or credentials to the repository
- **NEVER** log PII (email, name, address, financial data) in production code paths
- **ALWAYS** ask before making changes to authentication, authorization, or audit logging logic
- **ALWAYS** note SOC2 implications when creating architecture decisions
- **ALWAYS** present a diff and get explicit approval before applying any change

## Available Agents

Invoke by name or let Claude auto-route based on your task description.

### Global agents (available in all projects)

| Agent               | When to use                                                      |
| ------------------- | ---------------------------------------------------------------- |
| `typescript-expert` | Type errors, generics, strict-mode config, utility types         |
| `react-developer`   | Components, hooks, state patterns, accessibility in React        |
| `vite-engineer`     | Build config, plugins, env vars, bundle optimization             |
| `test-engineer`     | Vitest, React Testing Library, Playwright, test strategy         |
| `web-dev`           | HTTP, REST APIs, browser APIs, web performance, security headers |

### Project-local agents

| Agent           | When to use                                                              |
| --------------- | ------------------------------------------------------------------------ |
| `ux-designer`   | Accessibility audits, design system consistency, UX critique             |
| `architect`     | System design, trade-off analysis, ADR authoring, cross-cutting concerns |
| `planner`       | Feature decomposition, task breakdown, requirements clarification        |
| `code-reviewer` | PR reviews, SOC2 checks, convention enforcement                          |

## Available Skills (Slash Commands)

### Global skills

| Command             | Description                                 |
| ------------------- | ------------------------------------------- |
| `/commit`           | Secret-scanning conventional commit helper  |
| `/check-types`      | Run TypeScript type check and propose fixes |
| `/review-pr`        | Structured code review checklist            |
| `/security-check`   | SOC2-aware security and secret scan         |
| `/add-tests [file]` | Add Vitest/RTL/Playwright tests to a file   |

### Project-local skills

| Command                       | Description                                             |
| ----------------------------- | ------------------------------------------------------- |
| `/scaffold-component [Name]`  | Scaffold a React component with formatvault conventions |
| `/plan-feature [description]` | Decompose a feature into dependency-ordered tasks       |
| `/optimize-bundle`            | Analyze and optimize the Vite production bundle         |
| `/audit-a11y [component]`     | WCAG 2.1 AA accessibility audit                         |
| `/adr [title]`                | Create an Architecture Decision Record                  |

## Permission Table

### Always ask before

- Modifying `vite.config.ts`, `tsconfig.json`, or `package.json`
- Changing any authentication or authorization logic
- Adding new npm dependencies
- Modifying or deleting tests
- Any `git commit` or `git push` operation
- Modifying `.env.*` files
- Changing file/directory permissions

### Never do without explicit user instruction

- `git push` to any branch
- Permanent deletion of any file
- Changing document sharing or access controls
- Storing or logging PII
