import type { Route } from './+types/url-encoder';
import { buildMeta } from '@/lib/meta';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PaneActions } from '@/components/PaneActions';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { usePiiMasking } from '@/hooks/usePiiMasking';
import { useRegisterCommands } from '@/hooks/useRegisterCommands';
import { PiiMaskToggle } from '@/components/PiiMaskToggle';
import { type Command } from '@/stores/commandStore';
import { KeyboardShortcutsModal } from '@/components/KeyboardShortcutsModal';
import { useEditorStore } from '@/stores/editorStore';
import {
  encodeUrl,
  decodeUrl,
  looksLikeEncoded,
  parseQueryString,
  isUrlError,
  type UrlMode,
  type UrlEncodeVariant,
} from '@/features/tools/urlCodec';
import { Keyboard, ArrowLeftRight, Table2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export { RouteErrorBoundary as ErrorBoundary } from '@/components/RouteErrorBoundary';

export function meta(_args: Route.MetaArgs) {
  return buildMeta({
    title: 'URL Encoder & Decoder',
    description:
      'URL-encode and decode strings online for free. Uses encodeURIComponent for accurate percent-encoding. 100% client-side.',
    path: '/url-encoder',
  });
}

export default function UrlEncoderPage() {
  const [input, setInputRaw] = useState('');
  const [mode, setMode] = useState<UrlMode>('encode');
  const [variant, setVariant] = useState<UrlEncodeVariant>('component');
  const [showParsed, setShowParsed] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Load pre-loaded input from the landing page paste flow
  useEffect(() => {
    const preloaded = useEditorStore.getState().input;
    if (preloaded) {
      setInput(preloaded);
      useEditorStore.getState().reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-detect mode from input
  useEffect(() => {
    if (!input.trim()) return;
    setMode(looksLikeEncoded(input) ? 'decode' : 'encode');
  }, [input]);

  const result = input.trim()
    ? mode === 'encode'
      ? encodeUrl(input, variant)
      : decodeUrl(input)
    : null;

  const output = result && !isUrlError(result) ? result.output : '';
  const error = result && isUrlError(result) ? result.error : null;
  const pii = usePiiMasking(output);

  // Parsed query params (shown when output looks like a query string)
  const parsedParams = showParsed && output ? parseQueryString(output) : null;
  const inputParams = showParsed && input ? parseQueryString(input) : null;

  const setInput = useCallback((v: string) => {
    setInputRaw(v);
  }, []);
  const clear = useCallback(() => {
    setInputRaw('');
  }, []);
  const swap = useCallback(() => {
    if (output) {
      setInputRaw(output);
      setMode((m) => (m === 'encode' ? 'decode' : 'encode'));
    }
  }, [output]);

  const shortcuts = [
    {
      label: 'Swap input ↔ output',
      display: '⌘ ⇧ S',
      key: 's',
      meta: true,
      shift: true,
      handler: swap,
    },
    {
      label: 'Clear',
      display: '⌘ ⇧ K',
      key: 'k',
      meta: true,
      shift: true,
      handler: clear,
    },
    {
      label: 'Show keyboard shortcuts',
      display: '?',
      key: '?',
      handler: () => {
        setShowShortcuts(true);
      },
    },
  ];

  useKeyboardShortcuts(shortcuts, !showShortcuts);

  const commands = useMemo<Command[]>(
    () => [
      {
        id: 'action:swap',
        label: 'Swap input ↔ output',
        group: 'Actions',
        shortcut: '⌘ ⇧ S',
        handler: swap,
      },
      {
        id: 'action:clear',
        label: 'Clear',
        group: 'Actions',
        shortcut: '⌘ ⇧ K',
        handler: clear,
      },
    ],
    [swap, clear]
  );
  useRegisterCommands(commands);

  // Determine if input looks like a query string (for showing the parsed panel)
  const looksLikeQuery = /[?&=]/.test(input);

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-800 bg-gray-950 px-4 py-2">
        <h1 className="text-sm font-semibold text-gray-200">URL Encoder / Decoder</h1>
        <div className="h-4 w-px bg-gray-800" aria-hidden="true" />

        {/* Mode toggle */}
        <div className="flex items-center rounded-md border border-gray-800 bg-gray-900 p-0.5">
          {(['encode', 'decode'] as UrlMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
              }}
              className={cn(
                'rounded px-3 py-1 text-xs font-medium capitalize transition-colors',
                mode === m ? 'bg-gray-700 text-gray-100' : 'text-gray-500 hover:text-gray-300'
              )}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Variant toggle (encode only) */}
        {mode === 'encode' && (
          <div className="flex items-center rounded-md border border-gray-800 bg-gray-900 p-0.5">
            {(['component', 'full'] as UrlEncodeVariant[]).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => {
                  setVariant(v);
                }}
                className={cn(
                  'rounded px-3 py-1 text-xs font-medium transition-colors',
                  variant === v ? 'bg-gray-700 text-gray-100' : 'text-gray-500 hover:text-gray-300'
                )}
                title={
                  v === 'component'
                    ? 'encodeURIComponent — encode all special chars including / ? &'
                    : 'Full URL — preserve scheme, path separators, query delimiters'
                }
              >
                {v === 'component' ? 'Component' : 'Full URL'}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1" />

        {result && !isUrlError(result) && input.trim() && (
          <Badge variant="default" className="text-xs">
            ✓ {mode === 'encode' ? 'Encoded' : 'Decoded'}
          </Badge>
        )}
        {error && (
          <Badge variant="destructive" className="text-xs">
            ✗ Error
          </Badge>
        )}

        {/* Query parser toggle — only shown when input looks like a query string */}
        {looksLikeQuery && (
          <Button
            size="sm"
            variant={showParsed ? 'secondary' : 'ghost'}
            className="h-7 gap-1.5 px-3 text-xs"
            onClick={() => {
              setShowParsed((v) => !v);
            }}
            title="Show parsed query parameters"
          >
            <Table2 className="h-3 w-3" aria-hidden="true" />
            Parse params
          </Button>
        )}

        <Button
          size="sm"
          variant="ghost"
          className="h-7 gap-1.5 px-3 text-xs text-gray-400"
          onClick={swap}
          disabled={!output}
          title="Swap input and output (⌘⇧S)"
        >
          <ArrowLeftRight className="h-3 w-3" aria-hidden="true" />
          Swap
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-3 text-xs text-gray-400"
          onClick={clear}
          disabled={!input}
        >
          Clear
        </Button>

        <button
          type="button"
          className="rounded p-1 text-gray-500 hover:bg-gray-800 hover:text-gray-400"
          onClick={() => {
            setShowShortcuts(true);
          }}
          aria-label="Keyboard shortcuts"
          title="Keyboard shortcuts (?)"
        >
          <Keyboard className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>

      {/* Error bar */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 border-b border-red-900/60 bg-red-950/40 px-4 py-2 text-xs text-red-400"
        >
          <span className="shrink-0 font-mono font-semibold">Error</span>
          <span className="flex-1">{error}</span>
        </div>
      )}

      {/* Main split layout */}
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1">
          {/* Input */}
          <div className="flex w-1/2 flex-col border-r border-gray-800">
            <div className="flex items-center border-b border-gray-800 px-3 py-1.5">
              <span className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                {mode === 'encode' ? 'Decoded / plain text' : 'Encoded URL'}
              </span>
            </div>
            <textarea
              className="flex-1 resize-none bg-gray-950 p-4 font-mono text-sm text-gray-200 placeholder-gray-700 focus:outline-none"
              placeholder={
                mode === 'encode'
                  ? 'Paste or type text to encode…\n\ne.g. hello world & more'
                  : 'Paste a percent-encoded URL or query string…\n\ne.g. hello%20world%20%26%20more'
              }
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
              }}
              spellCheck={false}
              aria-label="Input"
            />
          </div>

          {/* Output */}
          <div className="flex w-1/2 flex-col">
            <div className="flex items-center justify-between border-b border-gray-800 px-3 py-1.5">
              <span className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                {mode === 'encode' ? 'Encoded URL' : 'Decoded / plain text'}
              </span>
              <div className="flex items-center gap-1">
                <PiiMaskToggle pii={pii} />
                <PaneActions
                  content={pii.displayContent}
                  downloadFilename={mode === 'encode' ? 'encoded.txt' : 'decoded.txt'}
                />
              </div>
            </div>
            <textarea
              className="flex-1 resize-none bg-gray-900 p-4 font-mono text-sm text-gray-300 placeholder-gray-700 focus:outline-none"
              placeholder={mode === 'encode' ? 'Encoded output…' : 'Decoded output…'}
              value={pii.displayContent}
              readOnly
              aria-label="Output"
              aria-live="polite"
            />
          </div>
        </div>

        {/* Parsed query params panel */}
        {showParsed && looksLikeQuery && (
          <div className="border-t border-gray-800 bg-gray-950">
            <div className="flex items-center gap-6 overflow-x-auto px-4 py-3">
              {/* Input params */}
              {inputParams && inputParams.length > 0 && (
                <table className="min-w-[200px] text-xs">
                  <thead>
                    <tr>
                      <th className="pb-1 text-left font-semibold text-gray-600 pr-4">
                        Input params
                      </th>
                    </tr>
                    <tr className="border-b border-gray-800">
                      <th className="pb-1 text-left font-medium text-gray-700 pr-4">Key</th>
                      <th className="pb-1 text-left font-medium text-gray-700">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inputParams.map(({ key, value }, i) => (
                      <tr key={i} className="border-b border-gray-900">
                        <td className="py-1 pr-4 font-mono text-gray-400">{key}</td>
                        <td className="py-1 font-mono text-gray-300">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Output params */}
              {parsedParams && parsedParams.length > 0 && (
                <table className="min-w-[200px] text-xs">
                  <thead>
                    <tr>
                      <th className="pb-1 text-left font-semibold text-gray-600 pr-4">
                        Output params
                      </th>
                    </tr>
                    <tr className="border-b border-gray-800">
                      <th className="pb-1 text-left font-medium text-gray-700 pr-4">Key</th>
                      <th className="pb-1 text-left font-medium text-gray-700">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedParams.map(({ key, value }, i) => (
                      <tr key={i} className="border-b border-gray-900">
                        <td className="py-1 pr-4 font-mono text-gray-400">{key}</td>
                        <td className="py-1 font-mono text-gray-300">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>

      <KeyboardShortcutsModal
        shortcuts={shortcuts}
        isOpen={showShortcuts}
        onClose={() => {
          setShowShortcuts(false);
        }}
      />
    </div>
  );
}
