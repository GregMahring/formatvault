import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { JsFormatOptions, JsResult } from './jsFormatter';
import type { JsFormatRequest } from '@/workers/jsFormatter.worker';

// ── Module mocks ──────────────────────────────────────────────────────────────

// formatJs is replaced with a controllable promise so tests can decide the
// order in which concurrent format runs finish.
vi.mock('./jsFormatter', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./jsFormatter')>();
  return { ...actual, formatJs: vi.fn() };
});

import { formatJs } from './jsFormatter';
import { useJsFormatter } from './useJsFormatter';

const formatJsMock = vi.mocked(formatJs);

// ── Helpers ───────────────────────────────────────────────────────────────────

function ok(output: string): JsResult {
  return { output, error: null };
}

function fail(error: string, line: number | null = null): JsResult {
  return { output: null, error, line, column: line === null ? null : 1 };
}

interface Deferred {
  resolve: (r: JsResult) => void;
}

/** Queue formatJs calls so each one resolves only when the test says so. */
function deferFormatCalls(): Deferred[] {
  const pending: Deferred[] = [];
  formatJsMock.mockImplementation(
    () =>
      new Promise<JsResult>((resolve) => {
        pending.push({ resolve });
      })
  );
  return pending;
}

class FakeWorker {
  static instances: FakeWorker[] = [];
  onmessage: ((e: MessageEvent) => void) | null = null;
  onerror: ((e: ErrorEvent) => void) | null = null;
  posted: JsFormatRequest[] = [];
  terminated = false;

  constructor() {
    FakeWorker.instances.push(this);
  }

  postMessage(msg: JsFormatRequest) {
    this.posted.push(msg);
  }

  terminate() {
    this.terminated = true;
  }

  respond(id: number, result: JsResult) {
    this.onmessage?.({ data: { id, result } } as MessageEvent);
  }

  fail(message: string) {
    this.onerror?.({ message } as ErrorEvent);
  }
}

beforeEach(() => {
  formatJsMock.mockReset();
});

// ── Inline fallback (no Worker, e.g. jsdom) ──────────────────────────────────

describe('useJsFormatter without Worker', () => {
  it('starts empty with default options', () => {
    const { result } = renderHook(() => useJsFormatter());
    expect(result.current).toMatchObject({
      input: '',
      output: '',
      error: null,
      isFormatting: false,
      parser: 'babel',
      indent: 2,
      printWidth: 80,
      singleQuote: false,
      semi: true,
      trailingComma: 'all',
    });
  });

  it('formats input and clears the formatting flag', async () => {
    formatJsMock.mockResolvedValue(ok('const a = 1;'));
    const { result } = renderHook(() => useJsFormatter());

    act(() => {
      result.current.setInput('const a=1');
    });
    act(() => {
      result.current.process();
    });
    expect(result.current.isFormatting).toBe(true);

    await waitFor(() => {
      expect(result.current.output).toBe('const a = 1;');
    });
    expect(result.current.isFormatting).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('passes the current options to formatJs', async () => {
    formatJsMock.mockResolvedValue(ok('x'));
    const { result } = renderHook(() => useJsFormatter());

    act(() => {
      result.current.setInput('x');
      result.current.setParser('typescript');
      result.current.setIndent('tab');
      result.current.setPrintWidth(120);
      result.current.setSingleQuote(true);
      result.current.setSemi(false);
      result.current.setTrailingComma('none');
    });
    act(() => {
      result.current.process();
    });

    await waitFor(() => {
      expect(result.current.isFormatting).toBe(false);
    });
    expect(formatJsMock).toHaveBeenCalledWith('x', {
      parser: 'typescript',
      indent: 'tab',
      printWidth: 120,
      singleQuote: true,
      semi: false,
      trailingComma: 'none',
    } satisfies JsFormatOptions);
  });

  it('surfaces errors and clears stale output', async () => {
    formatJsMock.mockResolvedValueOnce(ok('good'));
    formatJsMock.mockResolvedValueOnce(fail('Unexpected token (2:5)', 2));
    const { result } = renderHook(() => useJsFormatter());

    act(() => {
      result.current.setInput('good');
    });
    act(() => {
      result.current.process();
    });
    await waitFor(() => {
      expect(result.current.output).toBe('good');
    });

    act(() => {
      result.current.setInput('bad {');
    });
    act(() => {
      result.current.process();
    });
    await waitFor(() => {
      expect(result.current.error).toMatchObject({ error: 'Unexpected token (2:5)', line: 2 });
    });
    expect(result.current.output).toBe('');
  });

  it('skips formatting for whitespace-only input', () => {
    const { result } = renderHook(() => useJsFormatter());
    act(() => {
      result.current.setInput('   \n ');
    });
    act(() => {
      result.current.process();
    });
    expect(formatJsMock).not.toHaveBeenCalled();
    expect(result.current.isFormatting).toBe(false);
  });

  it('ignores a slow earlier run that finishes after a newer one', async () => {
    const pending = deferFormatCalls();
    const { result } = renderHook(() => useJsFormatter());

    act(() => {
      result.current.setInput('old');
    });
    act(() => {
      result.current.process();
    });
    act(() => {
      result.current.setInput('new');
    });
    act(() => {
      result.current.process();
    });
    expect(pending).toHaveLength(2);

    await act(async () => {
      pending[1]?.resolve(ok('NEW'));
      await Promise.resolve();
    });
    await act(async () => {
      pending[0]?.resolve(ok('OLD'));
      await Promise.resolve();
    });

    expect(result.current.output).toBe('NEW');
    expect(result.current.isFormatting).toBe(false);
  });

  it('discards an in-flight result after clear()', async () => {
    const pending = deferFormatCalls();
    const { result } = renderHook(() => useJsFormatter());

    act(() => {
      result.current.setInput('code');
    });
    act(() => {
      result.current.process();
    });
    act(() => {
      result.current.clear();
    });
    await act(async () => {
      pending[0]?.resolve(ok('formatted'));
      await Promise.resolve();
    });

    expect(result.current).toMatchObject({
      input: '',
      output: '',
      error: null,
      isFormatting: false,
    });
  });

  it('clears the error when input changes', async () => {
    formatJsMock.mockResolvedValue(fail('Unexpected token'));
    const { result } = renderHook(() => useJsFormatter());

    act(() => {
      result.current.setInput('bad {');
    });
    act(() => {
      result.current.process();
    });
    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
    });

    act(() => {
      result.current.setInput('bad {}');
    });
    expect(result.current.error).toBeNull();
  });
});

// ── Worker path ───────────────────────────────────────────────────────────────

describe('useJsFormatter with Worker', () => {
  beforeEach(() => {
    FakeWorker.instances = [];
    vi.stubGlobal('Worker', FakeWorker);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  function startFormat(result: { current: ReturnType<typeof useJsFormatter> }, input: string) {
    act(() => {
      result.current.setInput(input);
    });
    act(() => {
      result.current.process();
    });
  }

  it('creates one worker lazily and reuses it', () => {
    const { result } = renderHook(() => useJsFormatter());
    expect(FakeWorker.instances).toHaveLength(0);

    startFormat(result, 'a');
    startFormat(result, 'b');

    expect(FakeWorker.instances).toHaveLength(1);
    expect(FakeWorker.instances[0]?.posted.map((m) => m.input)).toEqual(['a', 'b']);
    expect(formatJsMock).not.toHaveBeenCalled();
  });

  it('applies only the response for the latest request', () => {
    const { result } = renderHook(() => useJsFormatter());
    startFormat(result, 'old');
    startFormat(result, 'new');
    const worker = FakeWorker.instances[0];
    const [oldReq, newReq] = worker?.posted ?? [];

    act(() => {
      if (newReq) worker?.respond(newReq.id, ok('NEW'));
      if (oldReq) worker?.respond(oldReq.id, ok('OLD'));
    });

    expect(result.current.output).toBe('NEW');
    expect(result.current.isFormatting).toBe(false);
  });

  it('reports a load failure, logs it, and recreates the worker next time', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { result } = renderHook(() => useJsFormatter());
    startFormat(result, 'a');

    act(() => {
      FakeWorker.instances[0]?.fail('import failed');
    });

    expect(result.current.error?.error).toMatch(/failed to load/i);
    expect(result.current.isFormatting).toBe(false);
    expect(FakeWorker.instances[0]?.terminated).toBe(true);
    expect(consoleError).toHaveBeenCalledWith(
      '[jsFormatter.worker] worker failed',
      'import failed'
    );

    startFormat(result, 'b');
    expect(FakeWorker.instances).toHaveLength(2);
  });

  it('terminates the worker on unmount', () => {
    const { result, unmount } = renderHook(() => useJsFormatter());
    startFormat(result, 'a');
    unmount();
    expect(FakeWorker.instances[0]?.terminated).toBe(true);
  });
});
