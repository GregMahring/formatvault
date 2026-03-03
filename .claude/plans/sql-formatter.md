# Plan: SQL Formatter

## Overview

Add a SQL formatter/validator at `/sql-formatter`. Uses `sql-formatter` (v15, TypeScript-first, browser-compatible, 15+ SQL dialects) for formatting and `@codemirror/lang-sql` for syntax highlighting. No SQL converters in this phase.

---

## New Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `sql-formatter` | ^15.7.0 | SQL parsing + formatting |
| `@codemirror/lang-sql` | ^6.10.0 | Syntax highlighting |

---

## Files to CREATE

### `src/features/sql/sqlFormatter.ts`
Pure functions, no React. Mirror the YAML formatter pattern.

**Types:**
```ts
export type SqlDialect = 'sql' | 'postgresql' | 'mysql' | 'transactsql' | 'sqlite' | 'bigquery' | 'snowflake';
export type SqlKeywordCase = 'upper' | 'lower' | 'preserve';

export interface SqlFormatOptions {
  dialect: SqlDialect;
  tabWidth: 2 | 4;
  keywordCase: SqlKeywordCase;
  linesBetweenQueries: 1 | 2;
}

export interface SqlFormatResult { output: string; error: null }
export interface SqlFormatError  { output: null; error: string }
export type SqlResult = SqlFormatResult | SqlFormatError;
```

**Functions:**
- `formatSql(input, options): SqlResult` — calls `sql-formatter`'s `format()`, catches any thrown errors
- `validateSql(input, dialect): SqlFormatError | null` — attempt format, return null on success
- `DEFAULT_SQL_OPTIONS: SqlFormatOptions` — `{ dialect: 'sql', tabWidth: 2, keywordCase: 'upper', linesBetweenQueries: 1 }`

`sql-formatter` v15 API: `import { format, FormatOptionsWithLanguage } from 'sql-formatter'; format(sql, { language, tabWidth, keywordCase, linesBetweenQueries })`

### `src/features/sql/sqlFormatter.test.ts`
- Valid SQL (SELECT, INSERT, multi-statement)
- Each dialect formats without error
- Invalid SQL (malformed) — sql-formatter is lenient and rarely throws; test that output is a non-empty string
- Empty input returns error
- `keywordCase` option changes casing
- `tabWidth` affects indentation

### `src/features/sql/useSqlFormatter.ts`
React hook mirroring `useTomlFormatter`. State: `input, output, error, dialect, tabWidth, keywordCase, linesBetweenQueries`. Actions: `setInput, setDialect, setTabWidth, setKeywordCase, setLinesBetweenQueries, process, clear`.

---

## Files to MODIFY

### `src/components/CodeEditor.tsx`
- Add `'sql'` to `EditorLanguage` type
- Lazy-load `@codemirror/lang-sql`:
  ```ts
  if (language === 'sql') {
    const { sql } = await import('@codemirror/lang-sql');
    return sql();
  }
  ```

### `src/routes.ts`
Add after the TOML formatter route:
```ts
route('sql-formatter', 'routes/sql-formatter.tsx'),
```

### `src/components/Header.tsx`
Add to `NAV_LINKS` after TOML:
```ts
{ to: '/sql-formatter', label: 'SQL' },
```

### `src/components/AppLayout.tsx`
Add `nav:sql-formatter` command after `nav:toml-formatter` in the static commands `useMemo`:
```ts
{
  id: 'nav:sql-formatter',
  label: 'SQL Formatter',
  group: 'Navigation',
  icon: Database,  // import Database from 'lucide-react'
  keywords: ['query', 'database', 'select', 'postgres', 'mysql'],
  handler: () => void navigate('/sql-formatter'),
}
```

### `src/lib/detectFormat.ts`
- Add `'sql'` to `DetectedFormat` union
- Add `'/sql-formatter'` to `FORMAT_TO_ROUTE`
- Add `isSql(input)` — keyword heuristic (no library needed, sql-formatter rarely throws):
  ```ts
  function isSql(input: string): boolean {
    return /^\s*(SELECT|INSERT\s+INTO|UPDATE\s+\w|DELETE\s+FROM|CREATE\s+(TABLE|DATABASE|INDEX)|DROP\s+(TABLE|DATABASE)|ALTER\s+TABLE|WITH\s+\w)/i.test(input.trim());
  }
  ```
- Insert SQL detection **after TOML, before Base64** — SQL keyword detection is fairly specific, low false-positive risk

---

## Files to CREATE (route)

### `src/routes/sql-formatter.tsx`
Mirrors `toml-formatter.tsx` closely. Key differences:
- **More toolbar options**: dialect select, keyword case select, lines-between-queries select (tabWidth comes from `useSettingsStore` like other formatters)
- **Diff panel**: Yes (same as YAML — SQL reformatting changes can be significant)
- **Tree view**: No (SQL doesn't parse to a JSON tree)
- **File upload**: `.sql` files, `parseFile(file, 'yaml')` (raw text passthrough)
- `meta()` for `/sql-formatter`
- Keyboard: `⌘↵` (format), `⌘D` (diff), `⌘⇧K` (clear), `?` (shortcuts)
- Command palette: format, clear, toggle-diff commands

---

## Implementation Order
1. `npm install sql-formatter @codemirror/lang-sql`
2. `src/features/sql/sqlFormatter.ts` + tests
3. `src/features/sql/useSqlFormatter.ts`
4. `src/components/CodeEditor.tsx` — add 'sql' + lazy-load
5. `src/routes/sql-formatter.tsx`
6. `src/routes.ts`, `Header.tsx`, `AppLayout.tsx`, `detectFormat.ts`
7. `npm run type-check && npm run test:run`

---

## Dialect Labels (toolbar dropdown)

| Value | Label |
|-------|-------|
| `sql` | Generic SQL |
| `postgresql` | PostgreSQL |
| `mysql` | MySQL / MariaDB |
| `transactsql` | T-SQL (SQL Server) |
| `sqlite` | SQLite |
| `bigquery` | BigQuery |
| `snowflake` | Snowflake |

---

## Verification
- `npm run type-check` — zero errors
- `npm run test:run` — all existing tests pass + new SQL tests
- Paste `select id,name from users where active=1` → formats with uppercase keywords and indentation
- Change dialect to PostgreSQL → formats correctly
- Toggle diff → shows before/after
- PII masking on output pane
- Paste SQL on landing page → routes to `/sql-formatter`
- Syntax highlighting active in SQL editor panes
