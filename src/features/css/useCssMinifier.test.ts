import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { CssMinifyResult } from './cssMinifier';
import type { CssMinifyRequest } from '@/workers/cssMinifier.worker';

// The real engine is WASM and can't run under jsdom (see cssMinifier.test.ts),
// so the hook is tested against a mock.
vi.mock('./cssMinifier', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./cssMinifier')>();
  return { ...actual, minifyCss: vi.fn() };
});

import { minifyCss } from './cssMinifier';
import { useCssMinifier } from './useCssMinifier';

const minifyCssMock = vi.mocked(minifyCss);

const STATS = { originalBytes: 100, minifiedBytes: 40, gzipBytes: 30 };

function ok(output: string): CssMinifyResult {
  return { output, error: null, stats: STATS };
}

interface Hook {
  current: ReturnType<typeof useCssMinifier>;
}

function minify(result: Hook, input: string) {
  act(() => {
    result.current.setInput(input);
  });
  act(() => {
    result.current.process();
  });
}

beforeEach(() => {
  minifyCssMock.mockReset();
});

describe('useCssMinifier without Worker', () => {
  it('sets output and stats on success', async () => {
    minifyCssMock.mockResolvedValue(ok('.a{color:red}'));
    const { result } = renderHook(() => useCssMinifier());

    minify(result, '.a { color: red }');
    expect(result.current.isMinifying).toBe(true);

    await waitFor(() => {
      expect(result.current.output).toBe('.a{color:red}');
    });
    expect(result.current).toMatchObject({ stats: STATS, error: null, isMinifying: false });
    expect(minifyCssMock).toHaveBeenCalledWith('.a { color: red }');
  });

  it('clears output and stats on error', async () => {
    minifyCssMock.mockResolvedValueOnce(ok('.a{color:red}'));
    minifyCssMock.mockResolvedValueOnce({
      output: null,
      error: 'Unexpected token',
      line: 2,
      column: 11,
    });
    const { result } = renderHook(() => useCssMinifier());

    minify(result, '.a { color: red }');
    await waitFor(() => {
      expect(result.current.stats).not.toBeNull();
    });

    minify(result, '.a { color red }');
    await waitFor(() => {
      expect(result.current.error).toMatchObject({ line: 2, column: 11 });
    });
    expect(result.current).toMatchObject({ output: '', stats: null });
  });

  it('skips whitespace-only input', () => {
    const { result } = renderHook(() => useCssMinifier());
    minify(result, '  \n');
    expect(minifyCssMock).not.toHaveBeenCalled();
    expect(result.current.isMinifying).toBe(false);
  });

  it('discards an in-flight result after clear()', async () => {
    let resolve: (r: CssMinifyResult) => void = () => undefined;
    minifyCssMock.mockImplementation(
      () =>
        new Promise<CssMinifyResult>((r) => {
          resolve = r;
        })
    );
    const { result } = renderHook(() => useCssMinifier());

    minify(result, '.a{}');
    act(() => {
      result.current.clear();
    });
    await act(async () => {
      resolve(ok('.a{}'));
      await Promise.resolve();
    });

    expect(result.current).toMatchObject({ input: '', output: '', stats: null });
  });
});

describe('useCssMinifier with Worker', () => {
  class FakeWorker {
    static instances: FakeWorker[] = [];
    onmessage: ((e: MessageEvent) => void) | null = null;
    onerror: ((e: ErrorEvent) => void) | null = null;
    posted: CssMinifyRequest[] = [];
    constructor() {
      FakeWorker.instances.push(this);
    }
    postMessage(msg: CssMinifyRequest) {
      this.posted.push(msg);
    }
    terminate() {
      // no-op
    }
  }

  beforeEach(() => {
    FakeWorker.instances = [];
    vi.stubGlobal('Worker', FakeWorker);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('sends input to the worker and applies its response', () => {
    const { result } = renderHook(() => useCssMinifier());
    minify(result, '.a { color: red }');

    const worker = FakeWorker.instances[0];
    const req = worker?.posted[0];
    if (!worker || !req) throw new Error('expected one request to the worker');
    expect(req).toMatchObject({ input: '.a { color: red }' });

    act(() => {
      worker.onmessage?.({ data: { id: req.id, result: ok('.a{color:red}') } } as MessageEvent);
    });
    expect(result.current).toMatchObject({ output: '.a{color:red}', stats: STATS });
    expect(minifyCssMock).not.toHaveBeenCalled();
  });

  it('shows a CSS-specific message if the worker fails to load', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { result } = renderHook(() => useCssMinifier());
    minify(result, '.a{}');

    act(() => {
      FakeWorker.instances[0]?.onerror?.({ message: 'boom' } as ErrorEvent);
    });
    expect(result.current.error).toMatchObject({
      error: expect.stringMatching(/css minifier failed to load/i) as string,
    });
  });
});
