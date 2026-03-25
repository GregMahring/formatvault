# `$ {}formatvault:`

**Private developer tools that run entirely in your browser.**

Format, validate, convert, and decode data without uploading it to anyone's server. No account. No telemetry on your input. Close the tab and it's gone.

**[formatvault.dev](https://formatvault.dev)**

---

## Why

Most online developer tools process your data on a remote server. That's a problem when you're working with JWT bearer tokens, customer CSV exports, internal API payloads, or anything else that shouldn't leave your machine.

formatvault takes the server out of the picture. Every operation runs in your browser tab using the same JavaScript engine your applications use. Your data never touches a network request.

---

## Tools

**Formatters & validators**

| Tool                       | URL               |
| -------------------------- | ----------------- |
| JSON Formatter & Validator | `/json-formatter` |
| CSV Formatter & Validator  | `/csv-formatter`  |
| YAML Formatter & Validator | `/yaml-formatter` |
| TOML Formatter & Validator | `/toml-formatter` |
| SQL Formatter & Beautifier | `/sql-formatter`  |
| Regex Tester               | `/regex-tester`   |

**Converters**

| Tool              | URL                       |
| ----------------- | ------------------------- |
| JSON → CSV        | `/json-to-csv-converter`  |
| JSON → YAML       | `/json-to-yaml-converter` |
| JSON → TOML       | `/json-to-toml-converter` |
| JSON → TypeScript | `/json-to-typescript`     |
| CSV → JSON        | `/csv-to-json-converter`  |
| CSV → YAML        | `/csv-to-yaml-converter`  |
| YAML → JSON       | `/yaml-to-json-converter` |
| YAML → CSV        | `/yaml-to-csv-converter`  |
| YAML → TOML       | `/yaml-to-toml-converter` |
| TOML → JSON       | `/toml-to-json-converter` |
| TOML → YAML       | `/toml-to-yaml-converter` |

**Utilities**

| Tool                                   | URL                          |
| -------------------------------------- | ---------------------------- |
| JWT Decoder                            | `/jwt-decoder`               |
| Base64 Encoder / Decoder               | `/base64-encoder`            |
| URL Encoder / Decoder                  | `/url-encoder`               |
| Hash Generator (MD5, SHA-256, SHA-512) | `/hash-generator`            |
| JSON Schema Generator & Validator      | `/json-schema-generator`     |
| Color Picker & Converter               | `/color-picker`              |
| Unix Timestamp Converter               | `/unix-timestamp-converter`  |
| Cron Expression Explainer              | `/cron-expression-explainer` |
| Number Base Converter                  | `/number-base-converter`     |

---

## Architecture

All data processing is client-side. There is no backend.

Key decisions:

- **No server round-trips for data** — `JSON.parse`, PapaParse, js-yaml, jose, and every other processing library runs in the browser bundle.
- **Large files stay local** — files above 1 MB are processed in a Web Worker via streaming parsers. A 200 MB CSV never leaves the machine.
- **No input persistence** — editor content is held only in JavaScript memory. It is never written to `localStorage`, IndexedDB, or anywhere else. It disappears when you close the tab.
- **`localStorage` for preferences only** — theme and indent size. Nothing else.

See [`docs/adr/`](docs/adr/) for all architecture decisions.

---

## Local development

**Requirements:** Node ≥ 20, npm ≥ 10

```bash
# Install dependencies
npm install

# Start the dev server (http://localhost:5173)
npm run dev
```

### All commands

| Command                 | Description                          |
| ----------------------- | ------------------------------------ |
| `npm run dev`           | Start dev server with HMR            |
| `npm run build`         | Production build                     |
| `npm run preview`       | Preview the production build locally |
| `npm run type-check`    | TypeScript type check (no emit)      |
| `npm run lint`          | ESLint                               |
| `npm run lint:fix`      | ESLint with auto-fix                 |
| `npm run format`        | Prettier write                       |
| `npm run format:check`  | Prettier check (used in CI)          |
| `npm run test`          | Vitest in watch mode                 |
| `npm run test:run`      | Vitest single run                    |
| `npm run test:coverage` | Vitest with coverage report          |
| `npm run test:e2e`      | Playwright end-to-end tests          |
| `npm run test:e2e:ui`   | Playwright with interactive UI       |

---

## Tech stack

| Concern        | Choice                                              |
| -------------- | --------------------------------------------------- |
| Language       | TypeScript 5 (strict mode)                          |
| UI             | React 19 — function components only                 |
| Build          | Vite + `@vitejs/plugin-react-swc`                   |
| Router         | React Router v7 (framework mode, SSR for meta tags) |
| Styling        | Tailwind CSS v4, semantic tokens, dark mode default |
| Components     | Radix UI primitives + shadcn/ui                     |
| State          | Zustand v5 (preferences only to `localStorage`)     |
| Code editor    | CodeMirror 6                                        |
| JSON (large)   | `@streamparser/json` streaming parser               |
| CSV            | PapaParse (streaming + Web Worker)                  |
| YAML           | js-yaml                                             |
| TOML           | smol-toml                                           |
| SQL            | sql-formatter                                       |
| JWT            | jose (decode only)                                  |
| Base64         | js-base64 (Unicode-safe)                            |
| Hashing        | Web Crypto API                                      |
| JSON Schema    | ajv + to-json-schema                                |
| XSS prevention | DOMPurify (all user HTML)                           |
| Testing        | Vitest + React Testing Library + Playwright         |
| Hosting        | Cloudflare Pages                                    |
| Analytics      | Plausible (cookieless, no PII)                      |

---

## Project structure

```
formatvault/
├── src/
│   ├── components/       # Shared UI components
│   │   └── ui/           # shadcn/ui primitives (owned, not ejected)
│   ├── features/         # Feature logic, co-located with tests
│   │   ├── json/
│   │   ├── csv/
│   │   ├── yaml/
│   │   ├── convert/
│   │   └── tools/
│   ├── hooks/            # Shared React hooks
│   ├── lib/              # Pure utilities (no React)
│   ├── routes/           # React Router v7 file-based routes
│   ├── stores/           # Zustand stores
│   ├── workers/          # Web Worker files
│   └── types/            # Shared TypeScript types
├── docs/
│   ├── PLANNING.md       # Project roadmap
│   └── adr/              # Architecture Decision Records
├── e2e/                  # Playwright tests
└── public/               # Static assets (favicon, og-image, robots.txt, llms.txt)
```

---

## CI

Every push and pull request runs:

1. **Type check** — `tsc --noEmit`
2. **Lint & format** — ESLint + Prettier
3. **Unit & component tests** — Vitest with coverage
4. **E2E tests** — Playwright (Chromium)
5. **Build** — production Vite build

---

## Contributing

1. Fork the repository and create a feature branch
2. Run `npm install` and `npm run dev`
3. Make your changes — keep them focused and minimal
4. Ensure `npm run type-check`, `npm run lint`, and `npm run test:run` all pass
5. Open a pull request with a clear description of what changed and why

**Security:** formatvault handles sensitive developer data. If you find a security issue, email [security@formatvault.dev](mailto:security@formatvault.dev) rather than opening a public issue.

---

## License

MIT — see [LICENSE](LICENSE).
