# ADR-0004: State Management with Zustand

**Date:** 2026-02-22
**Status:** Accepted
**Deciders:** Greg Mahring

---

## Context

formatvault needs state management for:

1. **UI preferences** (theme, font size, indent size) — persisted to `localStorage`
2. **Editor state** (current input, output, error) — in-memory only, never persisted
3. **Per-page settings** (delimiter choice, sort keys, etc.) — in-memory only

The app has no user authentication, no server-side state, and no complex derived state requirements. State is shallow and local to the browser session.

## Decision

Use **Zustand v5** for global state management, with the `persist` middleware for UI preferences only.

## Rationale

| Criterion             | Zustand                  | Context + hooks          | Jotai             | Redux Toolkit     |
| --------------------- | ------------------------ | ------------------------ | ----------------- | ----------------- |
| Boilerplate           | ✅ Minimal               | High                     | Minimal           | High              |
| Bundle size           | ✅ ~1KB                  | 0 (built-in)             | ~3KB              | ~10KB             |
| Re-render control     | ✅ Selector-based        | ⚠️ Prop drilling or memo | ✅ Atomic         | ✅ Selector-based |
| localStorage persist  | ✅ Built-in middleware   | Manual                   | Plugin            | Plugin            |
| DevTools              | ✅ Redux DevTools compat | None                     | ✅                | ✅ Best-in-class  |
| Learning curve        | ✅ Minimal               | ✅ Familiar              | Moderate          | High              |
| Fit for this use case | ✅ Perfect               | Verbose at scale         | Overkill (atomic) | Overkill          |

Zustand's subscriber model means components only re-render when the specific slice of state they subscribe to changes — no wrapping in `memo` or splitting contexts to avoid performance problems.

## Store Design

### `settingsStore` (persisted to localStorage)

```typescript
// src/stores/settingsStore.ts
interface SettingsState {
  theme: 'dark' | 'light';
  editorFontSize: number; // default: 14
  indentSize: 2 | 4 | 8; // default: 2
  autoFormat: boolean; // default: true
  setTheme: (theme: 'dark' | 'light') => void;
  setEditorFontSize: (size: number) => void;
  setIndentSize: (size: 2 | 4 | 8) => void;
  toggleAutoFormat: () => void;
  clearStoredData: () => void; // SOC2: user-accessible data wipe
}
```

**Only this store is persisted.** It contains no PII, no user content, no sensitive data.

### `editorStore` (in-memory only, never persisted)

```typescript
// src/stores/editorStore.ts
interface EditorState {
  input: string;
  output: string;
  error: string | null;
  isProcessing: boolean;
  setInput: (input: string) => void;
  setOutput: (output: string) => void;
  setError: (error: string | null) => void;
  setIsProcessing: (processing: boolean) => void;
  reset: () => void;
}
```

**This store is intentionally ephemeral.** User input (JSON, CSV, YAML content) must never be persisted.

## Consequences

### Positive

- Minimal boilerplate — stores are plain objects with actions
- `persist` middleware handles `localStorage` serialization with zero custom code
- Compatible with React 19 concurrent features
- Redux DevTools integration for debugging
- Easy to extend if additional stores are needed

### Negative

- No built-in time-travel debugging (unlike Redux) — acceptable for this use case
- Zustand's `persist` middleware stores plain JSON in localStorage — no encryption (acceptable since only non-sensitive preferences are stored)

## SOC2 Implications

- **`editorStore` must never use `persist` middleware** — enforced via code review and ESLint custom rule if needed.
- `settingsStore` must not be extended with user content fields without a new ADR and explicit approval.
- The `clearStoredData` action in `settingsStore` provides a user-facing "clear my data" option — satisfies data minimization expectations.
- localStorage contents must be documented in the privacy notice (what is stored, what is not).
