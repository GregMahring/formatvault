import { renderHook } from '@testing-library/react';
import { usePreloadedInput } from './usePreloadedInput';
import { useEditorStore } from '@/stores/editorStore';

function resetStore() {
  useEditorStore.setState({ input: '' });
}

function makeSetInput() {
  return vi.fn<(value: string) => void>();
}

describe('usePreloadedInput', () => {
  beforeEach(resetStore);
  afterEach(resetStore);

  it('calls setInput with the stored value on mount', () => {
    useEditorStore.setState({ input: 'hello world' });
    const setInput = makeSetInput();

    renderHook(() => {
      usePreloadedInput(setInput);
    });

    expect(setInput).toHaveBeenCalledExactlyOnceWith('hello world');
  });

  it('resets the store after consuming the value', () => {
    useEditorStore.setState({ input: 'some json' });
    const setInput = makeSetInput();

    renderHook(() => {
      usePreloadedInput(setInput);
    });

    expect(useEditorStore.getState().input).toBe('');
  });

  it('does not call setInput when the store is empty', () => {
    const setInput = makeSetInput();

    renderHook(() => {
      usePreloadedInput(setInput);
    });

    expect(setInput).not.toHaveBeenCalled();
  });

  it('does not reset the store when it was already empty', () => {
    const setInput = makeSetInput();

    renderHook(() => {
      usePreloadedInput(setInput);
    });

    expect(useEditorStore.getState().input).toBe('');
  });

  it('only fires on mount, not on re-render', () => {
    useEditorStore.setState({ input: 'initial' });
    const setInput = makeSetInput();

    const { rerender } = renderHook(() => {
      usePreloadedInput(setInput);
    });
    rerender();
    rerender();

    expect(setInput).toHaveBeenCalledOnce();
  });

  it('does not call setInput when the stored value is an empty string', () => {
    useEditorStore.setState({ input: '' });
    const setInput = makeSetInput();

    renderHook(() => {
      usePreloadedInput(setInput);
    });

    expect(setInput).not.toHaveBeenCalled();
  });
});
