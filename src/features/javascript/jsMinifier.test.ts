import { describe, it, expect } from 'vitest';
import {
  minifyJs,
  isJsMinifyError,
  DEFAULT_JS_MINIFY_OPTIONS,
  type JsMinifyOptions,
} from './jsMinifier';

const SOURCE = [
  '/*! MIT license */',
  '// helper',
  'function add(first, second) { /* inner */ return first + second }',
  'const unusedTop = 5;',
  'console.log(add(1, 2));',
].join('\n');

async function minifyOk(input: string, options: Partial<JsMinifyOptions> = {}): Promise<string> {
  const result = await minifyJs(input, { ...DEFAULT_JS_MINIFY_OPTIONS, ...options });
  if (isJsMinifyError(result)) throw new Error(`Unexpected minify error: ${result.error}`);
  return result.output;
}

describe('minifyJs', () => {
  it('compresses and mangles a module by default, keeping license comments', async () => {
    expect(await minifyOk(SOURCE)).toBe('/*! MIT license */\nconsole.log(1+2);');
  });

  it('keeps top-level names in script mode', async () => {
    const output = await minifyOk(SOURCE, { sourceType: 'script' });
    expect(output).toContain('function add(');
    expect(output).toContain('unusedTop=5');
  });

  it('keeps local names when mangling is off', async () => {
    const output = await minifyOk(SOURCE, { sourceType: 'script', mangle: false });
    expect(output).toContain('function add(first,second){return first+second}');
  });

  it('only strips whitespace when compression is off', async () => {
    const output = await minifyOk(SOURCE, { sourceType: 'script', compress: false });
    expect(output).toContain('unusedTop=5');
    expect(output).toContain('console.log(add(1,2))');
  });

  it.each([
    ['license', ['/*! MIT license */'], ['// helper', '/* inner */']],
    ['none', [], ['/*! MIT license */', '// helper', '/* inner */']],
    ['all', ['/*! MIT license */', '// helper', '/* inner */'], []],
  ] as const)('comments: %s', async (comments, kept, dropped) => {
    const output = await minifyOk(SOURCE, { sourceType: 'script', compress: false, comments });
    for (const c of kept) expect(output).toContain(c);
    for (const c of dropped) expect(output).not.toContain(c);
  });

  it('reports byte sizes, with gzip smaller than the minified output for large input', async () => {
    const input = 'export function f(alpha, beta) {\n  return alpha * beta;\n}\n'.repeat(200);
    const result = await minifyJs(input);
    expect(result).toMatchObject({
      error: null,
      stats: { originalBytes: input.length, gzipBytes: expect.any(Number) as number },
    });
    const { stats } = result as { stats: { minifiedBytes: number; gzipBytes: number } };
    expect(stats.minifiedBytes).toBeLessThan(input.length);
    expect(stats.gzipBytes).toBeLessThan(stats.minifiedBytes);
  });

  it('counts multi-byte characters as UTF-8 bytes', async () => {
    const result = await minifyJs('console.log("€")');
    expect(result).toMatchObject({ stats: { originalBytes: 'console.log("€")'.length + 2 } });
  });

  it('returns an error for empty input', async () => {
    expect(await minifyJs('  \n ')).toMatchObject({ output: null, error: 'Input is empty.' });
  });

  it('reports syntax errors with 1-based line and column', async () => {
    expect(await minifyJs('const ok = 1;\nconst a = {;')).toMatchObject({
      output: null,
      error: expect.stringContaining('Unexpected token') as string,
      line: 2,
      column: 12,
    });
  });

  it('rejects TypeScript syntax', async () => {
    expect(await minifyJs('let x: number = 1;')).toMatchObject({ output: null, line: 1 });
  });

  it('does not execute the input', async () => {
    const g = globalThis as { __fvMinifyExecuted?: boolean };
    await minifyOk('globalThis.__fvMinifyExecuted = true;');
    expect(g.__fvMinifyExecuted).toBeUndefined();
  });
});
