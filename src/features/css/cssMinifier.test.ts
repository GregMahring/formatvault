// @vitest-environment node
// jsdom's TextEncoder returns Uint8Arrays from another realm, which lightningcss's
// WASM bindings reject; the engine runs in a worker in production, not a DOM.
import { describe, it, expect } from 'vitest';
import { minifyCss, isCssMinifyError } from './cssMinifier';

async function minifyOk(input: string): Promise<string> {
  const result = await minifyCss(input);
  if (isCssMinifyError(result)) throw new Error(`Unexpected minify error: ${result.error}`);
  return result.output;
}

describe('minifyCss', () => {
  it('strips whitespace and shortens values', async () => {
    expect(await minifyOk('.a {\n  color: #ff0000;\n  margin: 0px 0px 0px 0px;\n}\n')).toBe(
      '.a{color:red;margin:0}'
    );
  });

  it('merges rules with identical declarations', async () => {
    expect(await minifyOk('.a { color: red } .b { color: red }')).toBe('.a,.b{color:red}');
  });

  // The reason csso and clean-css were rejected: both silently drop these rules.
  it('preserves native CSS nesting', async () => {
    expect(await minifyOk('.card { color: blue; &:hover { color: red } .x & { margin: 0 } }')).toBe(
      '.card{color:#00f;&:hover{color:red}.x &{margin:0}}'
    );
  });

  it.each([
    ['custom properties', ':root{--brand: #5555cc}.a{color:var(--brand)}', '--brand:#55c'],
    [':has()', '.a:has(> img) { aspect-ratio: 16 / 9 }', '.a:has(>img)'],
    ['@layer', '@layer base { .x { color: red } }', '@layer base{'],
    [
      '@container',
      '@container (min-width: 400px) { .b { inset: 0 } }',
      '@container (width>=400px)',
    ],
    ['@import with layer', '@import url("a.css") layer(base);', '@import "a.css" layer(base)'],
  ])('keeps modern syntax: %s', async (_name, input, expected) => {
    expect(await minifyOk(input)).toContain(expected);
  });

  it('keeps /*! license comments and drops others', async () => {
    const output = await minifyOk('/*! MIT */\n/* note */\n.a { color: red }');
    expect(output).toBe('/*! MIT */\n.a{color:red}');
  });

  it('reports byte sizes', async () => {
    const input = '.button {\n  padding: 0.5rem 1rem;\n  border-radius: 4px;\n}\n'.repeat(50);
    const result = await minifyCss(input);
    expect(result).toMatchObject({
      error: null,
      stats: { originalBytes: input.length, gzipBytes: expect.any(Number) as number },
    });
    const { stats } = result as { stats: { minifiedBytes: number } };
    expect(stats.minifiedBytes).toBeLessThan(input.length);
  });

  it('returns an error for empty input', async () => {
    expect(await minifyCss(' \n ')).toMatchObject({ output: null, error: 'Input is empty.' });
  });

  it('rejects invalid CSS with a location instead of silently repairing it', async () => {
    expect(await minifyCss('.ok { color: red }\n.a { color red; }')).toMatchObject({
      output: null,
      error: 'Unexpected token "red"',
      line: 2,
    });
  });

  it('rejects SCSS syntax', async () => {
    expect(await minifyCss('$gap: 1px;\n.a { margin: $gap }')).toMatchObject({
      output: null,
      line: 1,
    });
  });
});
