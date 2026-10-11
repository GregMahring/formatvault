import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import Home from './home';
import { useEditorStore } from '@/stores/editorStore';

// Home loads detectFormat with a dynamic import. Gating that import lets each
// test decide when the detector "finishes loading", so the out-of-order cases
// are deterministic instead of depending on module-loader timing.
const loader = vi.hoisted(() => {
  let release: () => void = () => undefined;
  let gate = Promise.resolve();
  return {
    hold() {
      gate = new Promise<void>((resolve) => {
        release = resolve;
      });
    },
    release: () => {
      release();
    },
    wait: () => gate,
  };
});

// MemoryRouter rather than createRoutesStub: the data router builds a fetch
// Request on navigation, and Node's fetch rejects jsdom's AbortSignal.
function renderHome() {
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/yaml-formatter" element={<p>YAML formatter page</p>} />
      </Routes>
    </MemoryRouter>
  );
  return screen.getByRole('textbox', { name: 'Paste data for auto-detection' });
}

/** Let the gated import and its .then() run, then flush React updates. */
async function releaseDetector() {
  loader.release();
  await act(async () => {
    await import('@/lib/detectFormat');
  });
}

describe('Home paste detection', () => {
  beforeEach(() => {
    // Re-register each test: a hoisted vi.mock factory runs only once per file
    // (resetModules doesn't clear it), so later tests would skip the gate.
    vi.resetModules();
    vi.doMock('@/lib/detectFormat', async (importOriginal) => {
      await loader.wait();
      return importOriginal();
    });
    useEditorStore.getState().reset();
  });

  it('detects a pasted format and keeps a single copy of the text', async () => {
    const user = userEvent.setup();
    const textarea = renderHome();

    await user.click(textarea);
    await user.paste('name: vault\nitems:\n  - a\n  - b');

    expect(await screen.findByText('Detected: YAML')).toBeInTheDocument();
    expect(textarea).toHaveValue('name: vault\nitems:\n  - a\n  - b');
  });

  it('detects typed input after the debounce', async () => {
    const user = userEvent.setup();
    const textarea = renderHome();

    await user.type(textarea, '{{"a": 1}');

    expect(await screen.findByText('Detected: JSON', {}, { timeout: 2000 })).toBeInTheDocument();
  });

  it('offers a manual tool picker when the format is unknown', async () => {
    const user = userEvent.setup();
    const textarea = renderHome();

    await user.click(textarea);
    await user.paste('just some words');

    expect(await screen.findByText(/Couldn't auto-detect the format/)).toBeInTheDocument();
  });

  it('hands the pasted input to the detected tool on "Start Formatting"', async () => {
    const user = userEvent.setup();
    const textarea = renderHome();

    await user.click(textarea);
    await user.paste('name: vault');
    await screen.findByText('Detected: YAML');
    await user.click(screen.getByRole('button', { name: 'Start Formatting' }));

    expect(await screen.findByText('YAML formatter page')).toBeInTheDocument();
    expect(useEditorStore.getState().input).toBe('name: vault');
  });

  it('ignores a result that arrives after the input was cleared', async () => {
    loader.hold();
    const user = userEvent.setup();
    const textarea = renderHome();

    await user.click(textarea);
    await user.paste('name: vault');
    await user.clear(textarea);
    await releaseDetector();

    expect(screen.queryByText(/^Detected:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Couldn't auto-detect the format/)).not.toBeInTheDocument();
  });

  it('shows the result for the latest paste when an earlier one resolves late', async () => {
    loader.hold();
    const user = userEvent.setup();
    const textarea = renderHome();

    await user.click(textarea);
    await user.paste('name: vault');
    await user.paste('{"a": 1}');
    await releaseDetector();

    expect(screen.getByText('Detected: JSON')).toBeInTheDocument();
    expect(screen.queryByText('Detected: YAML')).not.toBeInTheDocument();
  });
});
