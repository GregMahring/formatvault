import type { Plugin } from 'prettier';

export type JsParser = 'babel' | 'typescript';
export type JsIndent = 2 | 4 | 'tab';
export type JsPrintWidth = 80 | 100 | 120;
export type JsTrailingComma = 'all' | 'es5' | 'none';

export interface JsFormatOptions {
  parser: JsParser;
  indent: JsIndent;
  printWidth: JsPrintWidth;
  singleQuote: boolean;
  semi: boolean;
  trailingComma: JsTrailingComma;
}

export interface JsFormatSuccess {
  output: string;
  error: null;
}

export interface JsFormatError {
  output: null;
  error: string;
  line: number | null;
  column: number | null;
}

export type JsResult = JsFormatSuccess | JsFormatError;

export const DEFAULT_JS_OPTIONS: JsFormatOptions = {
  parser: 'babel',
  indent: 2,
  printWidth: 80,
  singleQuote: false,
  semi: true,
  trailingComma: 'all',
};

export function isJsError(r: JsResult): r is JsFormatError {
  return r.error !== null;
}

// Prettier and its parsers total ~170 KB gzipped (TypeScript adds ~210 KB more),
// so they load on first use rather than with the route chunk.
async function loadPrettier(parser: JsParser) {
  const [prettier, estree, parserPlugin] = await Promise.all([
    import('prettier/standalone'),
    import('prettier/plugins/estree'),
    parser === 'typescript'
      ? import('prettier/plugins/typescript')
      : import('prettier/plugins/babel'),
  ]);
  return { format: prettier.format, plugins: [estree, parserPlugin] as Plugin[] };
}

interface PrettierSyntaxError {
  message: string;
  loc?: { start?: { line?: number; column?: number } };
}

function toFormatError(err: unknown): JsFormatError {
  const e = err as PrettierSyntaxError;
  // Prettier appends a multi-line code frame; the editor already shows the source.
  const message = err instanceof Error ? (e.message.split('\n')[0] ?? e.message) : String(err);
  return {
    output: null,
    error: message,
    line: e.loc?.start?.line ?? null,
    column: e.loc?.start?.column ?? null,
  };
}

/**
 * Format JavaScript / TypeScript (including JSX/TSX) with Prettier.
 * The code is parsed, never executed.
 */
export async function formatJs(
  input: string,
  options: JsFormatOptions = DEFAULT_JS_OPTIONS
): Promise<JsResult> {
  if (!input.trim()) {
    return { output: null, error: 'Input is empty.', line: null, column: null };
  }

  try {
    const { format, plugins } = await loadPrettier(options.parser);
    const output = await format(input, {
      parser: options.parser,
      plugins,
      printWidth: options.printWidth,
      tabWidth: options.indent === 'tab' ? 2 : options.indent,
      useTabs: options.indent === 'tab',
      singleQuote: options.singleQuote,
      jsxSingleQuote: options.singleQuote,
      semi: options.semi,
      trailingComma: options.trailingComma,
    });
    return { output: output.trimEnd(), error: null };
  } catch (err) {
    return toFormatError(err);
  }
}
