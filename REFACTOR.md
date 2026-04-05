# formatvault — Refactoring Roadmap

Architecture review against Bulletproof React (feature-based modularity) and 2026 TypeScript best practices. Tasks are ordered by impact-to-effort ratio.

---

## Quick Wins

### ~~QW-1 — Fix `xml-formatter.tsx` file upload bug~~ ✅ DONE

**File:** `src/routes/xml-formatter.tsx` line 100
`fileParser.parseFile(file, 'yaml')` → `fileParser.parseFile(file, 'text')`

### ~~QW-2 — Fix `ConverterLayout` dead ternary in `handleFileUpload`~~ ✅ DONE

**File:** `src/components/ConverterLayout.tsx` line 122
`... : 'yaml'` (dead branch) → `... : 'text'`

### ~~QW-3 — Remove dead fields from `editorStore`~~ ✅ DONE

**File:** `src/stores/editorStore.ts`
Removed `output`, `error`, `isProcessing` and their setters. Store now only holds `input` + `reset()`.

### ~~QW-4 — Remove `autoFormat` phantom setting~~ ✅ DONE

**Files:** `src/stores/settingsStore.ts`, `src/components/AppLayout.tsx`
Removed `autoFormat` field, `setAutoFormat` action, `partialize` entry, command palette toggle, and unused `Zap` import.

### QW-5 — Remove or populate `src/types/`

**File:** `src/types/` (empty directory)
**Problem:** An empty `types/` directory signals to contributors that shared types live there. They don't — types are co-located in feature modules.
**Fix:** Delete the directory, or document in a README that types are co-located per feature.

### QW-6 — Create a shared route registry

**Files:** `src/components/AppLayout.tsx` (lines 89–238), `src/components/Header.tsx` (lines 14–57)
**Problem:** Both files independently hardcode the full tool route list. A new tool requires updating two files with no compile-time check that they're in sync.
**Fix:** Create `src/lib/routes.ts` exporting a typed `TOOLS` array with `{ label, path, icon, group, description }`. Both `AppLayout` command registration and `Header` nav groups consume this array.
**Why (Cal.com pattern):** Route metadata should have a single source of truth. Cal.com's `apps/web/lib/apps.ts` serves this role for their app registry.

---

## Structural Refactors

### SR-1 — Extract `usePreloadedInput` hook

**Affects:** 6 formatter routes + `ConverterLayout` + `jwt-decoder`, `base64-encoder`, `url-encoder`, `regex-tester` (12 sites total)
**Problem:** The editorStore preload pattern is copy-pasted across 12 files:

```ts
useEffect(() => {
  const preloaded = useEditorStore.getState().input;
  if (preloaded) {
    setInput(preloaded);
    useEditorStore.getState().reset();
  }
}, []);
```

**Fix:** Create `src/hooks/usePreloadedInput.ts`:

```ts
export function usePreloadedInput(setInput: (v: string) => void): void;
```

**Why (SRP):** A hook should own one concern. This pattern appears 12 times — it belongs in one place.

### SR-2 — Extract `useFormatterPage` orchestration hook

**Affects:** All 6 formatter routes (`json`, `yaml`, `xml`, `csv`, `sql`, `toml`)
**Problem:** Each formatter route repeats an identical triad of `useEffect`s:

1. Preload from `editorStore` on mount
2. 400ms debounce auto-process on input/option change
3. Seed input from `fileParser.result`

Plus identical boilerplate: `useKeyboardShortcuts`, `useRegisterCommands`, `usePiiMasking`.
The current `json-formatter.tsx` is 722 lines; a thin route using this hook would be ~200.

**Fix:** Create `src/hooks/useFormatterPage.ts` accepting `{ fmt, fileParser, shortcuts, commands }` and returning nothing (side-effects only). Internally handles SR-1, the debounce effect, and the file-result effect.

**Why (Bulletproof React):** Route files should express WHAT a page does, not HOW the framework wiring works. The DRY violation across 6 routes is the clearest refactor target in the codebase.

### SR-3 — Extract `useTreeData` hook

**Affects:** `json-formatter.tsx`, `yaml-formatter.tsx`, `toml-formatter.tsx`
**Problem:** Each duplicates a near-identical `useMemo` that parses `fmt.output || fmt.input` into tree-view data, catching parse errors silently.
**Fix:** Create `src/hooks/useTreeData.ts`:

```ts
export function useTreeData(
  output: string,
  input: string,
  parse: (s: string) => unknown
): unknown | undefined;
```

**Why:** Three identical `useMemo` blocks with identical try/catch and fallback logic is a textbook extraction candidate.

### SR-4 — Extract feature hooks for utility tool routes

**Affects:** `base64-encoder.tsx` (424 lines), `url-encoder.tsx` (384 lines), `regex-tester.tsx` (348 lines), `unix-timestamp-converter.tsx` (366 lines), `color-picker.tsx` (270 lines)
**Problem:** These routes own all state inline because `features/tools/` has pure logic files but no corresponding React hooks (except `useHashGenerator`). This is inconsistent with the json/yaml/csv/sql pattern.
**Fix:** Create:

- `src/features/tools/useBase64Encoder.ts`
- `src/features/tools/useUrlEncoder.ts`
- `src/features/tools/useRegexTester.ts`
- `src/features/tools/useTimestampConverter.ts`
- `src/features/tools/useColorPicker.ts`

Each hook owns the tool's state, derived values, and handlers. Route files become thin layout wrappers.
**Why (Bulletproof React):** Feature hooks are the pattern already established by `useJsonFormatter`, `useYamlFormatter`, etc. Consistency reduces onboarding cost and makes logic independently testable.

### SR-5 — Extract inline sub-components from route files

**Affects:**

- `cron-expression-explainer.tsx` — `CronBuilder` (187 lines), `FieldTable`, `FieldSelect`, `NextRunRow`
- `jwt-decoder.tsx` — `ClaimRow`, `TimestampRow`, `JsonBlock`, `TimingSection`
- `unix-timestamp-converter.tsx` — `ResultRow`

**Problem:** Defining components inside a route file violates SRP and makes them untestable in isolation. `CronBuilder` in particular is a fully interactive stateful component that deserves its own file.
**Fix:**

- Move cron sub-components to `src/features/tools/cron/` or `src/components/CronBuilder.tsx`
- Move JWT display components to `src/features/tools/jwt/` or `src/components/JwtViewer.tsx`

**Why (Bulletproof React):** Components defined inside a module file cannot be independently imported, tested, or reused. They are invisible to the component tree and to test runners targeting component files.

### SR-6 — `FormatterLayout` component (mirrors `ConverterLayout`)

**Affects:** All 6 formatter routes
**Depends on:** SR-2 (`useFormatterPage`)
**Problem:** `ConverterLayout` reduced 12 converter routes to thin wrappers of 60–120 lines each. The 6 formatter routes share an equivalent pattern (split pane, toolbar, error bar, file upload, keyboard shortcuts, SEO content slot) but have no equivalent shared layout. The largest formatter route (`json-formatter.tsx`) is 722 lines.
**Fix:** Create `src/components/FormatterLayout.tsx` accepting:

```ts
interface FormatterLayoutProps {
  title: string;
  language: EditorLanguage;
  fmt: {
    input: string;
    output: string;
    setInput: (v: string) => void;
    error: string | null;
    warning?: string | null;
  };
  fileParser: ReturnType<typeof useFileParser>;
  toolbarSlot?: ReactNode;
  rightPaneSlot?: ReactNode; // for diff / tree / markdown panel overrides
  children?: ReactNode; // SEO + FAQ content below the editor
}
```

This should be done AFTER SR-2 so the layout component stays purely presentational with no orchestration logic.
**Why (Bulletproof React):** Layout components are the primary reuse mechanism. `ConverterLayout` proves the pattern works — `FormatterLayout` completes the symmetry.

---

## Implementation Order

| Priority | Task                                  | Effort  | Impact                | Status  |
| -------- | ------------------------------------- | ------- | --------------------- | ------- |
| 1        | QW-1 Bug fix: xml-formatter parseFile | ~5 min  | Correctness           | ✅ Done |
| 2        | QW-2 Bug fix: ConverterLayout ternary | ~5 min  | Correctness           | ✅ Done |
| 3        | QW-3 Remove dead editorStore fields   | ~30 min | Clarity               | ✅ Done |
| 4        | QW-4 Remove/wire autoFormat           | ~20 min | Clarity               | ✅ Done |
| 5        | QW-5 Clean up types/                  | ~5 min  | Clarity               | ⬜      |
| 6        | QW-6 Shared route registry            | 2–3 hrs | Maintainability       | ⬜      |
| 7        | SR-1 usePreloadedInput hook           | ~1 hr   | DRY (12 sites)        | ⬜      |
| 8        | SR-3 useTreeData hook                 | ~1 hr   | DRY (3 sites)         | ⬜      |
| 9        | SR-4 Feature hooks for tool routes    | 3–4 hrs | Consistency + size    | ⬜      |
| 10       | SR-5 Extract inline sub-components    | 2–3 hrs | Testability + size    | ⬜      |
| 11       | SR-2 useFormatterPage hook            | 3–4 hrs | DRY + size (6 routes) | ⬜      |
| 12       | SR-6 FormatterLayout component        | 4–6 hrs | Size + consistency    | ⬜      |

SR-6 depends on SR-2. All other tasks are independent and can be done in any order.
