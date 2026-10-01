import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useFileParser } from './useFileParser';

function textFile(content: string, name = 'input.sql'): File {
  return new File([content], name, { type: 'text/plain' });
}

describe('useFileParser: text files', () => {
  it('returns small text files unparsed', async () => {
    const { result } = renderHook(() => useFileParser());
    act(() => {
      result.current.parseFile(textFile('SELECT 1;'), 'text');
    });
    await waitFor(() => {
      expect(result.current.result).toMatchObject({ output: 'SELECT 1;', error: null });
    });
  });

  // Regression: files ≥1 MB went to the parse worker, which rejected 'text' with
  // "Unknown format: text" — breaking large uploads on SQL/XML/TOML/JS/CSS tools.
  it('returns large text files unparsed without a worker round-trip', async () => {
    const content = 'SELECT * FROM t;\n'.repeat(70_000);
    expect(content.length).toBeGreaterThan(1024 * 1024);

    const { result } = renderHook(() => useFileParser());
    act(() => {
      result.current.parseFile(textFile(content), 'text');
    });
    await waitFor(() => {
      expect(result.current.isParsing).toBe(false);
    });
    expect(result.current.result?.error).toBeNull();
    expect(result.current.result?.output).toHaveLength(content.length);
  });
});
