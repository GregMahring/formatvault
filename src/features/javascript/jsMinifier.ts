import type { MinifyOptions } from 'terser';
import { computeMinifyStats, type MinifyStats } from '@/lib/byteSize';

/**
 * 'module' treats top-level declarations as private, so unused ones are dropped
 * and the rest renamed. 'script' keeps top-level names because other scripts on
 * the page may reference them as globals.
 */
export type JsSourceType = 'module' | 'script';

/** 'license' keeps `/*!`, `@license` and `@preserve` comments; the rest are dropped. */
export type JsCommentMode = 'license' | 'none' | 'all';

export interface JsMinifyOptions {
  sourceType: JsSourceType;
  compress: boolean;
  mangle: boolean;
  comments: JsCommentMode;
}

export interface JsMinifySuccess {
  output: string;
  error: null;
  stats: MinifyStats;
}

export interface JsMinifyError {
  output: null;
  error: string;
  line: number | null;
  column: number | null;
}

export type JsMinifyResult = JsMinifySuccess | JsMinifyError;

export const DEFAULT_JS_MINIFY_OPTIONS: JsMinifyOptions = {
  sourceType: 'module',
  compress: true,
  mangle: true,
  comments: 'license',
};

export function isJsMinifyError(r: JsMinifyResult): r is JsMinifyError {
  return r.error !== null;
}

const COMMENT_FORMAT: Record<JsCommentMode, NonNullable<MinifyOptions['format']>['comments']> = {
  license: 'some',
  none: false,
  all: 'all',
};

interface TerserParseError {
  message: string;
  line?: number;
  col?: number;
}

function toMinifyError(err: unknown): JsMinifyError {
  const e = err as TerserParseError;
  return {
    output: null,
    error: err instanceof Error ? e.message : String(err),
    line: e.line ?? null,
    // terser columns are 0-based; the formatter (Prettier) and editors use 1-based.
    column: e.col !== undefined ? e.col + 1 : null,
  };
}

/**
 * Minify JavaScript with terser. The code is parsed, never executed.
 * TypeScript and JSX are not supported — terser only parses standard JavaScript.
 */
export async function minifyJs(
  input: string,
  options: JsMinifyOptions = DEFAULT_JS_MINIFY_OPTIONS
): Promise<JsMinifyResult> {
  if (!input.trim()) {
    return { output: null, error: 'Input is empty.', line: null, column: null };
  }

  try {
    // ~130 KB gzipped, so it loads on first use rather than with the route chunk.
    const { minify } = await import('terser');
    const result = await minify(input, {
      // Output may use modern syntax (shorthand, arrows) since the input already does.
      ecma: 2020,
      module: options.sourceType === 'module',
      compress: options.compress,
      mangle: options.mangle,
      format: { comments: COMMENT_FORMAT[options.comments] },
    });
    const output = result.code ?? '';
    return {
      output,
      error: null,
      stats: await computeMinifyStats(input, output),
    };
  } catch (err) {
    return toMinifyError(err);
  }
}
