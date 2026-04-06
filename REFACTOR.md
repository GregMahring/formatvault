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

### ~~QW-5 — Remove or populate `src/types/`~~ ✅ DONE

Deleted the empty `src/types/` directory. Updated `CLAUDE.md` repository layout and Coding Conventions to document that types are co-located with their feature module.

### ~~QW-6 — Create a shared route registry~~ ✅ DONE

**Files:** `src/lib/routes.ts` (new), `src/components/AppLayout.tsx`, `src/components/Header.tsx`
Created `TOOL_ROUTES` (28 entries) with `{ id, label, navLabel?, path, group, icon, keywords? }`.
`NAV_GROUPS` and `getRoutesByGroup` derived from it. Both `Header` and `AppLayout` consume the registry.
AppLayout navigation commands now also cover all converter routes (previously missing).
Tests: `src/lib/routes.test.ts` — 23 tests covering uniqueness, shape, group helpers, and nav label fallback.

---

## Structural Refactors

### ~~SR-1 — Extract `usePreloadedInput` hook~~ ✅ DONE

**Files changed:** `src/hooks/usePreloadedInput.ts` (new), 6 formatter routes, `ConverterLayout`, `jwt-decoder`, `base64-encoder`, `url-encoder`, `regex-tester`, `json-schema-generator` (12 call sites).
Removed `useEditorStore` import from all 12 call sites. Removed `useEffect` from React imports in `regex-tester` and `jwt-decoder` (it was their only effect).
Tests: `src/hooks/usePreloadedInput.test.ts` — 6 tests.

### ~~SR-2 — Extract `useFormatterPage` orchestration hook~~ ✅ DONE

**Files changed:** `src/hooks/useFormatterPage.ts` (new), all 6 formatter routes.
Hook accepts `{ fmt, fileParser, fileType, shortcuts, commands, showShortcuts, optionsDepsKey?, skipAutoProcess?, clearInputOnFileError? }` and returns `{ pii, handleFileUpload }`.
Internally handles `usePreloadedInput`, 400ms debounce effect, file-result seeding effect, `useKeyboardShortcuts`, `useRegisterCommands`, and `usePiiMasking`.
Each route passes an `optionsDepsKey` string built from its formatter-specific options to drive the debounce deps.
JSON formatter uses `skipAutoProcess: fmt.isQueryMode` and `clearInputOnFileError: true`.
Tests: `src/hooks/useFormatterPage.test.ts` — 11 tests.

### ~~SR-3 — Extract `useTreeData` hook~~ ✅ DONE

**Files changed:** `src/hooks/useTreeData.ts` (new), `json-formatter.tsx`, `yaml-formatter.tsx`, `toml-formatter.tsx`.
YAML/TOML use result-object parsers (not throw-on-error), so each formatter got a module-level `parseXxxForTree` wrapper to normalize the interface. JSON passes `JSON.parse` directly.
Tests: `src/hooks/useTreeData.test.ts` — 11 tests.

### ~~SR-4 — Extract feature hooks for utility tool routes~~ ✅ DONE

**Files created:** `useBase64Encoder.ts`, `useUrlEncoder.ts`, `useRegexTester.ts`, `useTimestampConverter.ts`, `useColorPicker.ts` in `src/features/tools/`.
Each follows the `useHashGenerator` pattern: unexported State/Actions interfaces, hook returns their intersection. Routes now call the hook and keep only `showShortcuts`, `usePiiMasking`, `safeHighlightHtml` (regex), `useKeyboardShortcuts`, `useRegisterCommands`, and JSX.
Also fixed a pre-existing TDZ bug in base64/url-encoder where `usePreloadedInput(setInput)` was called before `setInput` was defined.

### ~~SR-5 — Extract inline sub-components from route files~~ ✅ DONE

**Files created:** `src/features/tools/CronBuilder.tsx` (CronBuilder, FieldSelect, builder constants), `src/features/tools/CronResultViews.tsx` (NextRunRow, FieldTable, date formatting), `src/features/tools/JwtViewer.tsx` (ClaimRow, TimestampRow, JsonBlock, TimingSection), `src/features/tools/TimestampRows.tsx` (ResultRow, TimestampCopyRow).
Also extracted `TimestampCopyRow` from `unix-timestamp-converter.tsx` (inline component not listed in original plan).
All three route files updated to import from the new locations.

### ~~SR-6 — `FormatterLayout` component (mirrors `ConverterLayout`)~~ ✅ DONE

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

**Implemented:** `src/components/FormatterLayout.tsx` with slots: `toolbarOptionsSlot`, `toolbarBadgesSlot`, `noticeSlot`, `fullPaneSlot`, `rightPaneSlot`, `rightPaneLabel`, `inputActionsSlot` (added for JSONPath toggle in JSON formatter's input pane header), `children`. All 6 formatter routes updated. JSON formatter also uses `formatLabel` prop for dynamic "Format" / "Run query" button label.

---

## Implementation Order

| Priority | Task                                  | Effort  | Impact                | Status  |
| -------- | ------------------------------------- | ------- | --------------------- | ------- |
| 1        | QW-1 Bug fix: xml-formatter parseFile | ~5 min  | Correctness           | ✅ Done |
| 2        | QW-2 Bug fix: ConverterLayout ternary | ~5 min  | Correctness           | ✅ Done |
| 3        | QW-3 Remove dead editorStore fields   | ~30 min | Clarity               | ✅ Done |
| 4        | QW-4 Remove/wire autoFormat           | ~20 min | Clarity               | ✅ Done |
| 5        | QW-5 Clean up types/                  | ~5 min  | Clarity               | ✅ Done |
| 6        | QW-6 Shared route registry            | 2–3 hrs | Maintainability       | ✅ Done |
| 7        | SR-1 usePreloadedInput hook           | ~1 hr   | DRY (12 sites)        | ✅ Done |
| 8        | SR-3 useTreeData hook                 | ~1 hr   | DRY (3 sites)         | ✅ Done |
| 9        | SR-4 Feature hooks for tool routes    | 3–4 hrs | Consistency + size    | ✅ Done |
| 10       | SR-5 Extract inline sub-components    | 2–3 hrs | Testability + size    | ✅ Done |
| 11       | SR-2 useFormatterPage hook            | 3–4 hrs | DRY + size (6 routes) | ✅ Done |
| 12       | SR-6 FormatterLayout component        | 4–6 hrs | Size + consistency    | ✅ Done |

SR-6 depends on SR-2. All other tasks are independent and can be done in any order.
