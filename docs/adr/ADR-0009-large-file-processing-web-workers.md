# ADR-0009: Large File Processing with Web Workers and Streaming Parsers

**Date:** 2026-02-22
**Status:** Accepted
**Deciders:** Greg Mahring

---

## Context

formatvault is a developer tool, and developers work with large datasets. A formatter that freezes the browser tab when processing a 10MB JSON file is not fit for purpose. Two problems must be solved simultaneously:

1. **UI thread blocking**: JavaScript is single-threaded. Heavy parsing blocks rendering.
2. **Memory pressure**: Loading an entire 500MB file into a string before parsing causes browser crashes.

## Decision

All file parsing for inputs exceeding **1MB** is offloaded to a **Web Worker**. Format-specific streaming parsers are used to process large files in chunks, keeping memory usage flat.

## Architecture

```
Main Thread (React)                    Web Worker (Background)
─────────────────────                  ──────────────────────
[File input / drop]
       │
       │  postMessage({ file, type })
       ▼
[useFileParser hook] ─────────────────► [fileParser.worker.ts]
                                               │
                                               ├── CSV: PapaParse (chunk callback)
                                               ├── JSON < 5MB: JSON.parse()
                                               ├── JSON ≥ 5MB: @streamparser/json
                                               └── YAML: js-yaml / yaml
                                               │
                       postMessage({ type: 'progress', pct: 45 })
[Progress bar update] ◄─────────────────────────────────────────
[Result rendered]     ◄── postMessage({ type: 'complete', data })
[Error shown]         ◄── postMessage({ type: 'error', message })
```

## Format-Specific Strategies

### CSV (PapaParse)

PapaParse has streaming built in via the `chunk` callback. Combined with `worker: true`, it handles files well beyond 500MB within browser memory constraints.

```typescript
Papa.parse(file, {
  worker: true, // PapaParse manages its own Web Worker
  chunk: (results) => {
    self.postMessage({ type: 'chunk', data: results.data });
  },
  complete: () => {
    self.postMessage({ type: 'complete' });
  },
});
```

### JSON — Small files (< 5MB)

Standard `JSON.parse()` in the Web Worker. Fast, simple, no streaming needed.

### JSON — Large files (≥ 5MB)

`@streamparser/json` — a streaming JSON parser that emits events as it discovers values, never loading the full document into memory.

```typescript
import { parser } from '@streamparser/json';

const p = parser();
p.onValue = (value, key, parent, stack) => {
  // Process each value as it's discovered
  self.postMessage({ type: 'value', key, value });
};

// Read file in 1MB chunks using File.slice()
const chunkSize = 1024 * 1024;
let offset = 0;
while (offset < file.size) {
  const slice = file.slice(offset, offset + chunkSize);
  const text = await slice.text();
  p.write(text);
  offset += chunkSize;
  self.postMessage({ type: 'progress', pct: Math.round((offset / file.size) * 100) });
}
```

### YAML

YAML has no streaming parser. `js-yaml` or the `yaml` package parses the entire document in memory. This is acceptable because:

- YAML is rarely used for datasets > 10MB (it's a config/document format, not a data transport format)
- Running in a Web Worker prevents UI blocking even for synchronous parsing

Practical YAML limit: **~100MB** (hardware-dependent).

## Realistic File Size Limits

| Format            | Without Worker      | With Worker + Streaming |
| ----------------- | ------------------- | ----------------------- |
| CSV               | ~10MB (UI blocking) | **500MB+**              |
| JSON (JSON.parse) | ~5MB                | ~50–100MB               |
| JSON (streaming)  | N/A                 | **500MB+**              |
| YAML              | ~5MB (UI blocking)  | ~100MB                  |

## React Hook API

```typescript
// src/hooks/useFileParser.ts
export function useFileParser(type: 'csv' | 'json' | 'yaml') {
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const parseFile = useCallback(
    (file: File) => {
      setIsProcessing(true);

      const worker = new Worker(new URL('../workers/fileParser.worker.ts', import.meta.url), {
        type: 'module',
      });

      worker.postMessage({ file, type });

      worker.onmessage = (e) => {
        const { type: msgType, data, pct } = e.data;
        if (msgType === 'progress') setProgress(pct);
        if (msgType === 'complete') {
          setIsProcessing(false);
          worker.terminate();
        }
        if (msgType === 'error') {
          setIsProcessing(false);
          worker.terminate();
        }
      };
    },
    [type]
  );

  return { parseFile, progress, isProcessing };
}
```

## Vite Configuration

Vite natively supports Web Workers via `new Worker(new URL(...), { type: 'module' })`. No additional plugins needed.

```typescript
// vite.config.ts
export default defineConfig({
  worker: {
    format: 'es', // ES module workers (modern browsers only)
  },
});
```

## Consequences

### Positive

- UI remains fully interactive during file parsing of any size
- Progress bars work accurately (Worker posts percentage updates)
- Memory stays flat for CSV and streaming JSON (chunk-based)
- Worker can be terminated if user cancels processing

### Negative

- Worker setup adds code complexity (message passing, terminate lifecycle)
- Streaming JSON requires `@streamparser/json` — adds ~15KB to bundle
- YAML is still memory-bound (no streaming parser available); accept ~100MB limit
- Structured clone of large data between Worker and main thread can be slow — use Transferable ArrayBuffers for large payloads

## File Size Warning UX

Show a warning when input exceeds 10MB:

- "Processing a large file. This may take a moment..."
- Progress bar appears
- Cancel button terminates the Worker

## SOC2 Implications

- Web Worker processing is entirely client-side — data never transmitted (consistent with ADR-0001)
- Worker errors must not surface internal stack traces to the UI
- File size limits (enforced at 500MB as a hard cap) prevent DoS via resource exhaustion in the browser
