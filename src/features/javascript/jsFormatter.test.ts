import { describe, it, expect } from 'vitest';
import { formatJs, isJsError, DEFAULT_JS_OPTIONS, type JsFormatOptions } from './jsFormatter';

function opts(overrides: Partial<JsFormatOptions> = {}): JsFormatOptions {
  return { ...DEFAULT_JS_OPTIONS, ...overrides };
}

async function formatOk(input: string, options?: Partial<JsFormatOptions>): Promise<string> {
  const result = await formatJs(input, opts(options));
  if (isJsError(result)) throw new Error(`Unexpected format error: ${result.error}`);
  return result.output;
}

describe('formatJs', () => {
  it('formats minified JavaScript with default options', async () => {
    const output = await formatOk('const a={b:1,"c":2};function f(x){return x}');
    expect(output).toBe('const a = { b: 1, c: 2 };\nfunction f(x) {\n  return x;\n}');
  });

  it('returns an error for empty input', async () => {
    expect(await formatJs('   \n  ')).toMatchObject({ output: null, error: 'Input is empty.' });
  });

  it('reports syntax errors with line and column, without the code frame', async () => {
    const result = await formatJs('const ok = 1;\nconst a = {;');
    expect(result).toMatchObject({
      output: null,
      line: 2,
      column: expect.any(Number) as number,
      error: expect.not.stringContaining('\n') as string,
    });
  });

  it('formats JSX with the babel parser', async () => {
    const output = await formatOk('const el=<div className="x"><span>{a}</span></div>');
    expect(output).toContain('<div className="x">');
  });

  it('formats TypeScript with the typescript parser', async () => {
    const output = await formatOk('interface A{b:string;c?:number}', { parser: 'typescript' });
    expect(output).toBe('interface A {\n  b: string;\n  c?: number;\n}');
  });

  it('rejects TypeScript-only syntax under the babel parser', async () => {
    const result = await formatJs('let x: number = 1; enum E { A }');
    expect(isJsError(result)).toBe(true);
  });

  it('indents with 4 spaces', async () => {
    const output = await formatOk('function f(){return 1}', { indent: 4 });
    expect(output).toContain('\n    return 1;');
  });

  it('indents with tabs', async () => {
    const output = await formatOk('function f(){return 1}', { indent: 'tab' });
    expect(output).toContain('\n\treturn 1;');
  });

  it('uses single quotes when requested', async () => {
    expect(await formatOk('const s = "hi"', { singleQuote: true })).toBe("const s = 'hi';");
  });

  it('omits semicolons when requested', async () => {
    expect(await formatOk('const s = 1;', { semi: false })).toBe('const s = 1');
  });

  it('respects trailing comma setting', async () => {
    const long = `foo(${'argumentNumberOne, '.repeat(5)}last)`;
    expect(await formatOk(long, { trailingComma: 'all' })).toMatch(/last,\n\)/);
    expect(await formatOk(long, { trailingComma: 'none' })).toMatch(/last\n\)/);
  });

  it('wraps according to print width', async () => {
    const input = 'const x = [aaaaaaaaaa, bbbbbbbbbb, cccccccccc, dddddddddd, eeeeeeeeee, ffff];';
    expect((await formatOk(input, { printWidth: 80 })).split('\n')).toHaveLength(1);
    const narrow =
      'const x = [aaaaaaaaaa, bbbbbbbbbb, cccccccccc, dddddddddd, eeeeeeeeee, ffffffffff, gggggggggg];';
    expect((await formatOk(narrow, { printWidth: 80 })).split('\n').length).toBeGreaterThan(1);
    expect((await formatOk(narrow, { printWidth: 120 })).split('\n')).toHaveLength(1);
  });

  it('preserves comments', async () => {
    const output = await formatOk('/* license */\n// note\nconst a=1');
    expect(output).toContain('/* license */');
    expect(output).toContain('// note');
  });

  it('does not execute the input', async () => {
    const g = globalThis as { __fvExecuted?: boolean };
    await formatOk('globalThis.__fvExecuted = true');
    expect(g.__fvExecuted).toBeUndefined();
  });
});
