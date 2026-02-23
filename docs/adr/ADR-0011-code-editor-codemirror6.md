# ADR-0011: Code Editor with CodeMirror 6

**Date:** 2026-02-22
**Status:** Accepted
**Deciders:** Greg Mahring

---

## Context

formatvault requires a code editor component for input and output panes that supports:

- Syntax highlighting for JSON, CSV, YAML (and future formats)
- Read-only mode for output panes
- Accessible keyboard navigation
- Dark and light themes
- Reasonable bundle size

## Decision

Use **CodeMirror 6** as the code editor for all input and output panes.

## Rationale

| Criterion           | CodeMirror 6               | Monaco Editor           | Plain `<textarea>` |
| ------------------- | -------------------------- | ----------------------- | ------------------ |
| Bundle size         | ✅ ~200KB gzipped          | ❌ ~1MB+ gzipped        | ✅ 0KB             |
| Syntax highlighting | ✅ JSON, YAML, XML, etc.   | ✅ Extensive            | ❌ None            |
| Accessibility       | ✅ ARIA, keyboard nav      | ⚠️ Limited ARIA         | ✅ Native          |
| React integration   | ✅ `@uiw/react-codemirror` | ⚠️ Community wrapper    | ✅ Native          |
| Dark/light theme    | ✅ Built-in themes         | ✅ Built-in themes      | ❌ Manual          |
| Extensibility       | ✅ Plugin architecture     | ✅ Rich API             | ❌ None            |
| Mobile support      | ✅ Good                    | ❌ Poor                 | ✅ Good            |
| VS Code feel        | ⚠️ Different but clean     | ✅ Identical to VS Code | ❌ N/A             |

Monaco Editor (VS Code's editor) was considered but rejected primarily on **bundle size**. At 1MB+ gzipped, Monaco adds unacceptable page weight for a tool where fast load time is a feature. It is also poorly optimized for mobile and has limited accessibility support.

CodeMirror 6 is modular — only the language packages actually used are bundled. Language modules are **lazy-loaded** per route (JSON language module only loads on `/json-formatter`, etc.).

## Implementation

React wrapper via `@uiw/react-codemirror`:

```typescript
// src/components/CodeEditor.tsx
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { oneDark } from '@codemirror/theme-one-dark';

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language: 'json' | 'csv' | 'yaml' | 'xml' | 'text';
  readOnly?: boolean;
  label: string; // Required for accessibility
}
```

Language modules are dynamically imported:

```typescript
const langExtension = useMemo(async () => {
  switch (language) {
    case 'json':
      return (await import('@codemirror/lang-json')).json();
    case 'yaml':
      return (await import('@codemirror/lang-yaml')).yaml();
    // ...
  }
}, [language]);
```

## Themes

- **Dark mode**: `@codemirror/theme-one-dark` (included in core bundle — default theme)
- **Light mode**: CodeMirror default light theme

Theme switches in sync with `settingsStore.theme` (see ADR-0004).

## Accessibility

CodeMirror 6 is the most accessible code editor available for the web:

- Full keyboard navigation within editor
- ARIA `role="textbox"` with proper labeling
- Screen reader support
- Focus management compatible with Radix UI patterns

Each `<CodeEditor>` instance requires a `label` prop that maps to an `aria-label` — enforced by TypeScript type system.

## Consequences

### Positive

- ~200KB bundle vs Monaco's 1MB+ — significant page weight saving
- Modular: lazy-load language packs per route
- Accessible: WCAG 2.1 AA compatible
- Mobile-friendly (unlike Monaco)
- Clean, professional appearance suitable for developer tools

### Negative

- Not "VS Code in the browser" — some power users may prefer Monaco's features (multi-cursor, find/replace, minimap). These are out of scope for a formatter tool.
- `@uiw/react-codemirror` is a community wrapper — not first-party. Monitor for maintenance.
- CSV has no official CodeMirror language package — use plain text mode or a custom minimal highlighter.

## SOC2 Implications

- Accessibility (WCAG 2.1 AA) is partially addressed by CodeMirror's built-in keyboard nav and ARIA (CC6)
- Editor content is processed entirely in-memory — no persistence (consistent with ADR-0010)
