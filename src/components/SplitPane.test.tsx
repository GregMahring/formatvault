import { act, fireEvent, render, screen } from '@testing-library/react';
import { SplitPane } from './SplitPane';

// jsdom has no matchMedia; report a desktop viewport so the resize widths apply.
beforeAll(() => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
  );
});

afterAll(() => {
  vi.unstubAllGlobals();
});

function renderSplit() {
  render(
    <SplitPane leftLabel="Input pane" rightLabel="Output pane">
      <p>left</p>
      <p>right</p>
    </SplitPane>
  );
  return {
    handle: screen.getByRole('separator', { name: 'Resize panels' }),
    leftPane: screen.getByRole('region', { name: 'Input pane' }),
  };
}

const value = (handle: HTMLElement) => Number(handle.getAttribute('aria-valuenow'));

describe('SplitPane resize handle', () => {
  it('is a vertical window splitter announcing the left panel size', () => {
    const { handle, leftPane } = renderSplit();

    expect(handle).toHaveAttribute('aria-orientation', 'vertical');
    expect(handle).toHaveAttribute('aria-valuemin', '20');
    expect(handle).toHaveAttribute('aria-valuemax', '80');
    expect(handle).toHaveAttribute('aria-valuetext', 'Left panel 50%');
    expect(handle).toHaveAttribute('tabindex', '0');
    expect(leftPane).toHaveStyle({ width: '50%' });
  });

  it('resizes with arrow, page, Home/End and Enter keys, clamped to 20–80%', () => {
    const { handle, leftPane } = renderSplit();

    fireEvent.keyDown(handle, { key: 'ArrowRight' });
    expect(value(handle)).toBe(51);
    fireEvent.keyDown(handle, { key: 'PageDown' });
    expect(value(handle)).toBe(61);
    fireEvent.keyDown(handle, { key: 'PageUp' });
    fireEvent.keyDown(handle, { key: 'ArrowLeft' });
    expect(value(handle)).toBe(50);

    fireEvent.keyDown(handle, { key: 'Home' });
    expect(value(handle)).toBe(20);
    fireEvent.keyDown(handle, { key: 'ArrowLeft' });
    expect(value(handle)).toBe(20);

    fireEvent.keyDown(handle, { key: 'End' });
    expect(value(handle)).toBe(80);
    fireEvent.keyDown(handle, { key: 'PageDown' });
    expect(value(handle)).toBe(80);
    expect(leftPane).toHaveStyle({ width: '80%' });

    fireEvent.keyDown(handle, { key: 'Enter' });
    expect(value(handle)).toBe(50);
  });

  it('cycles 50 → 70 → 30 → 50% when clicked without dragging', () => {
    const { handle } = renderSplit();
    const click = () => {
      fireEvent.mouseDown(handle);
      act(() => {
        window.dispatchEvent(new MouseEvent('mouseup'));
      });
    };

    click();
    expect(value(handle)).toBe(70);
    click();
    expect(value(handle)).toBe(30);
    click();
    expect(value(handle)).toBe(50);
  });

  it('cycles on a tap, since touch devices get no click event', () => {
    const { handle } = renderSplit();

    fireEvent.touchStart(handle);
    act(() => {
      window.dispatchEvent(new TouchEvent('touchend'));
    });

    expect(value(handle)).toBe(70);
  });

  it('follows the pointer when dragged and does not cycle on release', () => {
    const { handle } = renderSplit();
    // jsdom does no layout; give the container a 1000px-wide box at x=0
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      width: 1000,
    } as DOMRect);

    fireEvent.mouseDown(handle);
    act(() => {
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 650 }));
      window.dispatchEvent(new MouseEvent('mouseup'));
    });
    expect(value(handle)).toBe(65);

    // Dragging past the limit clamps
    fireEvent.mouseDown(handle);
    act(() => {
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 950 }));
      window.dispatchEvent(new MouseEvent('mouseup'));
    });
    expect(value(handle)).toBe(80);

    vi.restoreAllMocks();
  });
});
