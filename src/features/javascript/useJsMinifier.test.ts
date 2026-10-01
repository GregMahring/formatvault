import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { JsMinifyOptions, JsMinifyResult } from './jsMinifier';
import type { JsMinifyRequest } from '@/workers/jsMinifier.worker';

vi.mock('./jsMinifier', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./jsMinifier')>();
  return { ...actual, minifyJs: vi.fn() };
});

import { minifyJs } from './jsMinifier';
import { useJsMinifier } from './useJsMinifier';

const minifyJsMock = vi.mocked(minifyJs);

const STATS = { originalBytes: 100, minifiedBytes: 40, gzipBytes: 30 };

function ok(output: string): JsMinifyResult {
  return { output, error: null, stats: STATS };
}

function fail(error: string): JsMinifyResult {
  return { output: null, error, line: 1, column: 5 };
}

interface Hook {
  current: ReturnType<typeof useJsMinifier>;
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
  minifyJsMock.mockReset();
});

describe('useJsMinifier without Worker', () => {
  it('starts empty with default options', () => {
    const { result } = renderHook(() => useJsMinifier());
    expect(result.current).toMatchObject({
      input: '',
      output: '',
      error: null,
      stats: null,
      isMinifying: false,
      sourceType: 'module',
      compress: true,
      mangle: true,
      comments: 'license',
    });
  });

  it('sets output and stats on success', async () => {
    minifyJsMock.mockResolvedValue(ok('a();'));
    const { result } = renderHook(() => useJsMinifier());

    minify(result, 'a ( ) ;');
    expect(result.current.isMinifying).toBe(true);

    await waitFor(() => {
      expect(result.current.output).toBe('a();');
    });
    expect(result.current.stats).toEqual(STATS);
    expect(result.current.isMinifying).toBe(false);
  });

  it('passes the current options to minifyJs', async () => {
    minifyJsMock.mockResolvedValue(ok('x'));
    const { result } = renderHook(() => useJsMinifier());

    act(() => {
      result.current.setSourceType('script');
      result.current.setCompress(false);
      result.current.setMangle(false);
      result.current.setComments('all');
    });
    minify(result, 'x');

    await waitFor(() => {
      expect(result.current.isMinifying).toBe(false);
    });
    expect(minifyJsMock).toHaveBeenCalledWith('x', {
      sourceType: 'script',
      compress: false,
      mangle: false,
      comments: 'all',
    } satisfies JsMinifyOptions);
  });

  it('clears output and stale stats when minification fails', async () => {
    minifyJsMock.mockResolvedValueOnce(ok('good'));
    minifyJsMock.mockResolvedValueOnce(fail('Unexpected token'));
    const { result } = renderHook(() => useJsMinifier());

    minify(result, 'good');
    await waitFor(() => {
      expect(result.current.stats).not.toBeNull();
    });

    minify(result, 'bad {');
    await waitFor(() => {
      expect(result.current.error).toMatchObject({ error: 'Unexpected token', line: 1 });
    });
    expect(result.current.output).toBe('');
    expect(result.current.stats).toBeNull();
  });

  it('clears output and stats when the input is emptied', async () => {
    minifyJsMock.mockResolvedValue(ok('a();'));
    const { result } = renderHook(() => useJsMinifier());

    minify(result, 'a()');
    await waitFor(() => {
      expect(result.current.stats).not.toBeNull();
    });

    minify(result, '   ');
    expect(result.current).toMatchObject({ output: '', stats: null, isMinifying: false });
    expect(minifyJsMock).toHaveBeenCalledTimes(1);
  });

  it('discards an in-flight result after clear()', async () => {
    let resolve: (r: JsMinifyResult) => void = () => undefined;
    minifyJsMock.mockImplementation(
      () =>
        new Promise<JsMinifyResult>((r) => {
          resolve = r;
        })
    );
    const { result } = renderHook(() => useJsMinifier());

    minify(result, 'code');
    act(() => {
      result.current.clear();
    });
    await act(async () => {
      resolve(ok('minified'));
      await Promise.resolve();
    });

    expect(result.current).toMatchObject({ input: '', output: '', stats: null });
  });
});

describe('useJsMinifier with Worker', () => {
  class FakeWorker {
    static instances: FakeWorker[] = [];
    onmessage: ((e: MessageEvent) => void) | null = null;
    onerror: ((e: ErrorEvent) => void) | null = null;
    posted: JsMinifyRequest[] = [];
    constructor() {
      FakeWorker.instances.push(this);
    }
    postMessage(msg: JsMinifyRequest) {
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

  it('sends input and options to the worker and applies its response', () => {
    const { result } = renderHook(() => useJsMinifier());
    minify(result, 'a ( )');

    const worker = FakeWorker.instances[0];
    const req = worker?.posted[0];
    if (!worker || !req) throw new Error('expected one request to the worker');
    expect(req).toMatchObject({ input: 'a ( )', options: { sourceType: 'module' } });

    act(() => {
      worker.onmessage?.({ data: { id: req.id, result: ok('a()') } } as MessageEvent);
    });
    expect(result.current).toMatchObject({ output: 'a()', stats: STATS, isMinifying: false });
    expect(minifyJsMock).not.toHaveBeenCalled();
  });

  it('shows a minifier-specific message if the worker fails to load', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { result } = renderHook(() => useJsMinifier());
    minify(result, 'a()');

    act(() => {
      FakeWorker.instances[0]?.onerror?.({ message: 'boom' } as ErrorEvent);
    });
    expect(result.current.error).toMatchObject({
      error: expect.stringMatching(/minifier failed to load/i) as string,
    });
    expect(result.current.isMinifying).toBe(false);
  });
});
