import { renderHook } from '@testing-library/react';
import { useTreeData } from './useTreeData';

const parseJson = (s: string): unknown => JSON.parse(s);
const parseAlwaysFails = (_s: string): unknown => {
  throw new Error('parse error');
};
const parseReturnsUndefined = (_s: string): unknown => undefined;

describe('useTreeData', () => {
  it('returns undefined when both output and input are empty', () => {
    const { result } = renderHook(() => useTreeData('', '', parseJson));
    expect(result.current).toBeUndefined();
  });

  it('returns undefined when source is only whitespace', () => {
    const { result } = renderHook(() => useTreeData('   ', '  ', parseJson));
    expect(result.current).toBeUndefined();
  });

  it('prefers output over input when both are non-empty', () => {
    const { result } = renderHook(() => useTreeData('{"a":1}', '{"b":2}', parseJson));
    expect(result.current).toEqual({ a: 1 });
  });

  it('falls back to input when output is empty', () => {
    const { result } = renderHook(() => useTreeData('', '{"b":2}', parseJson));
    expect(result.current).toEqual({ b: 2 });
  });

  it('returns the parsed value when parse succeeds', () => {
    const { result } = renderHook(() => useTreeData('[1,2,3]', '', parseJson));
    expect(result.current).toEqual([1, 2, 3]);
  });

  it('returns undefined when parse throws', () => {
    const { result } = renderHook(() => useTreeData('not valid json', '', parseAlwaysFails));
    expect(result.current).toBeUndefined();
  });

  it('returns undefined when parse returns undefined', () => {
    const { result } = renderHook(() => useTreeData('anything', '', parseReturnsUndefined));
    expect(result.current).toBeUndefined();
  });

  it('recomputes when output changes', () => {
    const { result, rerender } = renderHook(
      ({ out }: { out: string }) => useTreeData(out, '', parseJson),
      { initialProps: { out: '{"x":1}' } }
    );
    expect(result.current).toEqual({ x: 1 });

    rerender({ out: '{"x":2}' });
    expect(result.current).toEqual({ x: 2 });
  });

  it('recomputes when input changes', () => {
    const { result, rerender } = renderHook(
      ({ inp }: { inp: string }) => useTreeData('', inp, parseJson),
      { initialProps: { inp: '{"y":1}' } }
    );
    expect(result.current).toEqual({ y: 1 });

    rerender({ inp: '{"y":9}' });
    expect(result.current).toEqual({ y: 9 });
  });

  it('recomputes when parse function changes', () => {
    const parseA = (_s: string): unknown => ({ source: 'A' });
    const parseB = (_s: string): unknown => ({ source: 'B' });

    const { result, rerender } = renderHook(
      ({ parse }: { parse: (s: string) => unknown }) => useTreeData('data', '', parse),
      { initialProps: { parse: parseA } }
    );
    expect(result.current).toEqual({ source: 'A' });

    rerender({ parse: parseB });
    expect(result.current).toEqual({ source: 'B' });
  });

  it('returns undefined when output clears to empty after having a value', () => {
    const { result, rerender } = renderHook(
      ({ out }: { out: string }) => useTreeData(out, '', parseJson),
      { initialProps: { out: '{"x":1}' } }
    );
    expect(result.current).toEqual({ x: 1 });

    rerender({ out: '' });
    expect(result.current).toBeUndefined();
  });
});
