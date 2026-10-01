import { computeMinifyStats, type MinifyStats } from '@/lib/byteSize';

export interface CssMinifySuccess {
  output: string;
  error: null;
  stats: MinifyStats;
}

export interface CssMinifyError {
  output: null;
  error: string;
  line: number | null;
  column: number | null;
}

export type CssMinifyResult = CssMinifySuccess | CssMinifyError;

export function isCssMinifyError(r: CssMinifyResult): r is CssMinifyError {
  return r.error !== null;
}

type Lightningcss = typeof import('lightningcss-wasm');

let enginePromise: Promise<Lightningcss> | null = null;

// lightningcss is ~3.8 MB of gzipped WASM, so it loads on first use and only once.
// Pure-JS minifiers (csso, clean-css) were rejected because they silently delete
// nested CSS rules; see ADR-0012.
function loadEngine(): Promise<Lightningcss> {
  enginePromise ??= (async () => {
    const [engine, { default: wasmUrl }] = await Promise.all([
      import('lightningcss-wasm'),
      import('lightningcss-wasm/lightningcss_node.wasm?url'),
    ]);
    // An explicit URL survives Vite's dependency pre-bundling, which breaks the
    // package's own import.meta.url lookup. Under Node (tests) there is no
    // `location`, and lightningcss's Node build reads the WASM from disk instead.
    const wasmRequest =
      typeof location === 'undefined' ? undefined : new Request(new URL(wasmUrl, location.href));
    await engine.default(wasmRequest);
    return engine;
  })().catch((err: unknown) => {
    enginePromise = null;
    throw err;
  });
  return enginePromise;
}

interface LightningcssError {
  message: string;
  loc?: { line?: number; column?: number };
}

// lightningcss names tokens by their Rust enum variant, e.g. `Ident("red")`;
// show just the source text: `"red"`.
function readableMessage(message: string): string {
  return message.replace(/\b[A-Z]\w*\("((?:[^"\\]|\\.)*)"\)/g, '"$1"');
}

function toMinifyError(err: unknown): CssMinifyError {
  const e = err as LightningcssError;
  return {
    output: null,
    error: readableMessage(err instanceof Error ? e.message : String(err)),
    line: e.loc?.line ?? null,
    column: e.loc?.column ?? null,
  };
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

/**
 * Minify CSS with lightningcss. Modern syntax (nesting, :has(), @layer,
 * @container) is preserved as written; nothing is transpiled for older
 * browsers. `/*!` license comments are kept, other comments dropped.
 * Invalid CSS is rejected rather than silently repaired.
 */
export async function minifyCss(input: string): Promise<CssMinifyResult> {
  if (!input.trim()) {
    return { output: null, error: 'Input is empty.', line: null, column: null };
  }

  let engine: Lightningcss;
  try {
    engine = await loadEngine();
  } catch (err) {
    console.error('[cssMinifier] failed to load lightningcss', err);
    return {
      output: null,
      error: 'CSS minifier failed to load. Please reload the page and try again.',
      line: null,
      column: null,
    };
  }

  try {
    const result = engine.transform({
      filename: 'input.css',
      code: encoder.encode(input),
      minify: true,
    });
    const output = decoder.decode(result.code);
    return {
      output,
      error: null,
      stats: await computeMinifyStats(input, output),
    };
  } catch (err) {
    return toMinifyError(err);
  }
}
