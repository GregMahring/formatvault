import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useFormatterPage } from './useFormatterPage';

// ── Module mocks ──────────────────────────────────────────────────────────────

vi.mock('./usePreloadedInput', () => ({
  usePreloadedInput: vi.fn(),
}));

vi.mock('./usePiiMasking', () => ({
  usePiiMasking: vi.fn((content: string) => ({
    displayContent: content,
    isMasked: false,
    toggleMask: vi.fn(),
  })),
}));

vi.mock('./useKeyboardShortcuts', () => ({
  useKeyboardShortcuts: vi.fn(),
}));

vi.mock('./useRegisterCommands', () => ({
  useRegisterCommands: vi.fn(),
}));

import { usePreloadedInput } from './usePreloadedInput';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import { useRegisterCommands } from './useRegisterCommands';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeFmt(overrides: Partial<{ input: string; output: string }> = {}) {
  return {
    input: overrides.input ?? '',
    output: overrides.output ?? '',
    setInput: vi.fn<(v: string) => void>(),
    process: vi.fn(),
  };
}

function makeFileParser(result: { output: string; error: string | null } | null = null) {
  return {
    isParsing: false,
    progress: 0,
    showProgress: false,
    result: result ? { ...result, fileName: 'test.json', fileSize: 100 } : null,
    parseFile: vi.fn<(file: File, format: string) => void>(),
    reset: vi.fn(),
  };
}

const baseShortcuts = [
  { label: 'Format', display: '⌘ ↵', key: 'Enter', meta: true as const, handler: vi.fn() },
];
const baseCommands = [
  { id: 'action:format', label: 'Format', group: 'Actions' as const, handler: vi.fn() },
];

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useFormatterPage', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('calls usePreloadedInput with fmt.setInput', () => {
    const fmt = makeFmt();
    const fileParser = makeFileParser();

    renderHook(() =>
      useFormatterPage({
        fmt,
        fileParser,
        fileType: 'json',
        shortcuts: baseShortcuts,
        commands: baseCommands,
        showShortcuts: false,
      })
    );

    expect(usePreloadedInput).toHaveBeenCalledWith(fmt.setInput);
  });

  it('calls useKeyboardShortcuts with shortcuts and !showShortcuts', () => {
    const fmt = makeFmt();
    const fileParser = makeFileParser();

    renderHook(() =>
      useFormatterPage({
        fmt,
        fileParser,
        fileType: 'json',
        shortcuts: baseShortcuts,
        commands: baseCommands,
        showShortcuts: true,
      })
    );

    expect(useKeyboardShortcuts).toHaveBeenCalledWith(baseShortcuts, false);
  });

  it('calls useRegisterCommands with commands', () => {
    const fmt = makeFmt();
    const fileParser = makeFileParser();

    renderHook(() =>
      useFormatterPage({
        fmt,
        fileParser,
        fileType: 'json',
        shortcuts: baseShortcuts,
        commands: baseCommands,
        showShortcuts: false,
      })
    );

    expect(useRegisterCommands).toHaveBeenCalledWith(baseCommands);
  });

  it('calls fmt.process after 400ms when input is non-empty', () => {
    const fmt = makeFmt({ input: '{"a":1}' });
    const fileParser = makeFileParser();

    renderHook(() =>
      useFormatterPage({
        fmt,
        fileParser,
        fileType: 'json',
        shortcuts: baseShortcuts,
        commands: baseCommands,
        showShortcuts: false,
      })
    );

    expect(fmt.process).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(fmt.process).toHaveBeenCalledOnce();
  });

  it('does not call fmt.process when input is empty', () => {
    const fmt = makeFmt({ input: '' });
    const fileParser = makeFileParser();

    renderHook(() =>
      useFormatterPage({
        fmt,
        fileParser,
        fileType: 'json',
        shortcuts: baseShortcuts,
        commands: baseCommands,
        showShortcuts: false,
      })
    );

    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(fmt.process).not.toHaveBeenCalled();
  });

  it('does not call fmt.process when skipAutoProcess is true', () => {
    const fmt = makeFmt({ input: '{"a":1}' });
    const fileParser = makeFileParser();

    renderHook(() =>
      useFormatterPage({
        fmt,
        fileParser,
        fileType: 'json',
        shortcuts: baseShortcuts,
        commands: baseCommands,
        showShortcuts: false,
        skipAutoProcess: true,
      })
    );

    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(fmt.process).not.toHaveBeenCalled();
  });

  it('seeds fmt.setInput from fileParser.result.output', () => {
    const fmt = makeFmt();
    const fileParser = makeFileParser({ output: 'loaded content', error: null });

    renderHook(() =>
      useFormatterPage({
        fmt,
        fileParser,
        fileType: 'yaml',
        shortcuts: baseShortcuts,
        commands: baseCommands,
        showShortcuts: false,
      })
    );

    expect(fmt.setInput).toHaveBeenCalledWith('loaded content');
  });

  it('clears input on file error when clearInputOnFileError is true', () => {
    const fmt = makeFmt({ input: 'existing' });
    const fileParser = makeFileParser({ output: '', error: 'parse failed' });

    renderHook(() =>
      useFormatterPage({
        fmt,
        fileParser,
        fileType: 'json',
        shortcuts: baseShortcuts,
        commands: baseCommands,
        showShortcuts: false,
        clearInputOnFileError: true,
      })
    );

    expect(fmt.setInput).toHaveBeenCalledWith('');
  });

  it('does not clear input on file error when clearInputOnFileError is false', () => {
    const fmt = makeFmt({ input: 'existing' });
    const fileParser = makeFileParser({ output: '', error: 'parse failed' });

    renderHook(() =>
      useFormatterPage({
        fmt,
        fileParser,
        fileType: 'yaml',
        shortcuts: baseShortcuts,
        commands: baseCommands,
        showShortcuts: false,
        clearInputOnFileError: false,
      })
    );

    expect(fmt.setInput).not.toHaveBeenCalled();
  });

  it('handleFileUpload calls fileParser.parseFile with the correct fileType', () => {
    const fmt = makeFmt();
    const fileParser = makeFileParser();

    const { result } = renderHook(() =>
      useFormatterPage({
        fmt,
        fileParser,
        fileType: 'yaml',
        shortcuts: baseShortcuts,
        commands: baseCommands,
        showShortcuts: false,
      })
    );

    const file = new File(['content'], 'test.yaml', { type: 'text/yaml' });
    result.current.handleFileUpload(file);

    expect(fileParser.parseFile).toHaveBeenCalledExactlyOnceWith(file, 'yaml');
  });

  it('returns pii with displayContent from fmt.output', () => {
    const fmt = makeFmt({ output: 'formatted output' });
    const fileParser = makeFileParser();

    const { result } = renderHook(() =>
      useFormatterPage({
        fmt,
        fileParser,
        fileType: 'json',
        shortcuts: baseShortcuts,
        commands: baseCommands,
        showShortcuts: false,
      })
    );

    expect(result.current.pii.displayContent).toBe('formatted output');
  });
});
