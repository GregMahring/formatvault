import type { Route } from './+types/url-encoder';
import { buildMeta } from '@/lib/meta';
import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PaneActions } from '@/components/PaneActions';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { usePiiMasking } from '@/hooks/usePiiMasking';
import { useRegisterCommands } from '@/hooks/useRegisterCommands';
import { PiiMaskToggle } from '@/components/PiiMaskToggle';
import { type Command } from '@/stores/commandStore';
import { KeyboardShortcutsModal } from '@/components/KeyboardShortcutsModal';
import { type UrlMode, type UrlEncodeVariant } from '@/features/tools/urlCodec';
import { useUrlEncoder } from '@/features/tools/useUrlEncoder';
import { Keyboard, ArrowLeftRight, Table2 } from 'lucide-react';
import { ToolPageContent } from '@/components/ToolPageContent';
import { cn } from '@/lib/utils';

export { RouteErrorBoundary as ErrorBoundary } from '@/components/RouteErrorBoundary';

const FAQ = [
  {
    q: 'What is the difference between component and full URL encoding?',
    a: 'Component mode encodes every reserved character, which is what you want for a single query parameter value or path segment. Full URL mode keeps the characters that give a URL its structure — such as : / ? # & and = — and encodes everything else, such as spaces and non-ASCII characters. Existing %XX escapes are left as they are.',
  },
  {
    q: 'Why does my decoded output still contain + signs?',
    a: 'Standard URL decoding only turns %20 into a space. A + means a space only in HTML form submissions (application/x-www-form-urlencoded), so it is left as-is. Replace + with %20 first if your input came from a form.',
  },
  {
    q: 'What does the query parameter parser do?',
    a: 'Paste a query string, with or without the leading ?, and every key and value is listed in a table, decoded. It is a quick way to read the long parameter lists in tracking and redirect URLs.',
  },
  {
    q: 'Why do I get an error when decoding?',
    a: 'The input contains a % that is not followed by two hex digits, or a byte sequence that is not valid UTF-8. This usually means the string was only partly encoded or was truncated.',
  },
  {
    q: 'Is it safe to decode URLs that contain tokens?',
    a: "Yes. Encoding and decoding use your browser's built-in functions, and nothing is sent to a server. That matters for OAuth callbacks, signed URLs, and magic links, which often carry live credentials.",
  },
];

export function meta(_args: Route.MetaArgs) {
  return buildMeta({
    title: 'URL Encoder & Decoder — Private, No Upload',
    description:
      'URL-encode and decode strings privately in your browser — no data sent anywhere. Supports query parameter parsing, all special characters, and component vs full URL encoding.',
    path: '/url-encoder',
    faqItems: FAQ,
  });
}

export default function UrlEncoderPage() {
  const {
    input,
    mode,
    variant,
    showParsed,
    output,
    error,
    looksLikeQuery,
    parsedParams,
    inputParams,
    setInput,
    setMode,
    setVariant,
    setShowParsed,
    clear,
    swap,
  } = useUrlEncoder();
  const [showShortcuts, setShowShortcuts] = useState(false);

  const pii = usePiiMasking(output);

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

  return (
    <>
      {/* shrink-0: the layout's scroll container would otherwise squeeze the tool to fit the content below it. */}
      <div className="flex h-full shrink-0 flex-col">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-edge bg-surface px-4 py-2">
          <h1 className="text-sm font-semibold text-label-indigo">URL Encoder / Decoder</h1>
          <div className="h-4 w-px bg-surface-elevated" aria-hidden="true" />

          {/* Mode toggle */}
          <div className="flex items-center rounded-md border border-edge bg-surface-raised p-0.5">
            {(['encode', 'decode'] as UrlMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                }}
                className={cn(
                  'rounded px-3 py-1 text-xs font-medium capitalize transition-colors',
                  mode === m ? 'bg-surface-elevated text-fg' : 'text-fg-secondary hover:text-fg'
                )}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Variant toggle (encode only) */}
          {mode === 'encode' && (
            <div className="flex items-center rounded-md border border-edge bg-surface-raised p-0.5">
              {(['component', 'full'] as UrlEncodeVariant[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => {
                    setVariant(v);
                  }}
                  className={cn(
                    'rounded px-3 py-1 text-xs font-medium transition-colors',
                    variant === v
                      ? 'bg-surface-elevated text-fg'
                      : 'text-fg-secondary hover:text-fg'
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

          {output && input.trim() && !error && (
            <Badge variant="success" dot>
              {mode === 'encode' ? 'encoded' : 'decoded'}
            </Badge>
          )}
          {error && (
            <Badge variant="destructive" dot>
              error
            </Badge>
          )}

          {/* Query parser toggle — only shown when input looks like a query string */}
          {looksLikeQuery && (
            <Button
              size="sm"
              variant={showParsed ? 'secondary' : 'ghost'}
              className="h-7 gap-1.5 px-3 text-xs"
              onClick={() => {
                setShowParsed(!showParsed);
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
            className="h-7 gap-1.5 px-3 text-xs text-fg-secondary"
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
            className="h-7 px-3 text-xs text-fg-secondary"
            onClick={clear}
            disabled={!input}
          >
            Clear
          </Button>

          <button
            type="button"
            className="rounded p-1 text-fg-secondary hover:bg-surface-elevated hover:text-fg"
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
            className="flex items-start gap-2 border-b border-danger-fg/30 bg-danger-fg/10 px-4 py-2 text-xs text-danger-fg"
          >
            <span className="shrink-0 font-mono font-semibold">Error</span>
            <span className="flex-1">{error}</span>
          </div>
        )}

        {/* Main split layout */}
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex min-h-0 flex-1 flex-col md:flex-row">
            {/* Input */}
            <div className="flex w-full flex-col border-b border-r-0 border-edge md:w-1/2 md:border-b-0 md:border-r">
              <div className="flex h-8 shrink-0 items-center border-b border-edge px-3">
                <span className="text-[11px] font-medium uppercase tracking-wide text-label-cyan">
                  {mode === 'encode' ? 'Decoded / plain text' : 'Encoded URL'}
                </span>
              </div>
              <textarea
                className="flex-1 resize-none bg-surface-raised p-4 font-mono text-sm text-fg placeholder:text-fg-secondary focus:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-accent-500"
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
            <div className="flex w-full flex-col md:w-1/2">
              <div className="flex h-8 shrink-0 items-center justify-between border-b border-edge px-3">
                <span className="text-[11px] font-medium uppercase tracking-wide text-label-cyan">
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
                className="flex-1 resize-none bg-surface-raised p-4 font-mono text-sm text-fg placeholder:text-fg-secondary focus:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-accent-500"
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
            <div className="border-t border-edge bg-surface">
              <div className="flex items-center gap-6 overflow-x-auto px-4 py-3">
                {/* Input params */}
                {inputParams && inputParams.length > 0 && (
                  <table className="min-w-[200px] text-xs">
                    <thead>
                      <tr>
                        <th className="pb-1 text-left font-semibold text-fg-tertiary pr-4">
                          Input params
                        </th>
                      </tr>
                      <tr className="border-b border-edge">
                        <th className="pb-1 text-left font-medium text-fg-tertiary pr-4">Key</th>
                        <th className="pb-1 text-left font-medium text-fg-tertiary">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inputParams.map(({ key, value }, i) => (
                        <tr key={i} className="border-b border-surface-raised">
                          <td className="py-1 pr-4 font-mono text-fg-secondary">{key}</td>
                          <td className="py-1 font-mono text-fg-secondary">{value}</td>
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
                        <th className="pb-1 text-left font-semibold text-fg-tertiary pr-4">
                          Output params
                        </th>
                      </tr>
                      <tr className="border-b border-edge">
                        <th className="pb-1 text-left font-medium text-fg-tertiary pr-4">Key</th>
                        <th className="pb-1 text-left font-medium text-fg-tertiary">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedParams.map(({ key, value }, i) => (
                        <tr key={i} className="border-b border-surface-raised">
                          <td className="py-1 pr-4 font-mono text-fg-secondary">{key}</td>
                          <td className="py-1 font-mono text-fg-secondary">{value}</td>
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
      <ToolPageContent
        toolName="URL encoder"
        why={
          <div className="space-y-3 text-fg-secondary">
            <p>
              URLs carry more secrets than people expect: OAuth codes, password-reset tokens, signed
              storage links, session IDs, and API keys in query strings. Pasting one into an online
              decoder can hand a working credential to whoever runs that site.
            </p>
            <p>
              formatvault encodes and decodes URLs with your browser&apos;s built-in functions.
              Nothing is uploaded or logged, so you can inspect a live callback URL without leaking
              it.
            </p>
          </div>
        }
        howItWorks={
          <div className="space-y-3 text-fg-secondary">
            <p>
              Encoding uses the standard encodeURIComponent function, which percent-encodes every
              character outside the unreserved set as UTF-8 bytes — so emoji and accented characters
              are handled correctly. Full URL mode uses encodeURI instead, which leaves the
              URL&apos;s scheme, host, path, and query delimiters intact.
            </p>
            <p>
              Decoding reverses the process with decodeURIComponent and reports malformed sequences
              instead of producing garbled output. The query parser splits a query string into its
              parameters and decodes each one.
            </p>
          </div>
        }
        useCases={[
          'Encoding a value before adding it to a query string by hand',
          'Decoding an OAuth or SSO callback URL to see which parameters came back',
          'Reading a long query string as a table of decoded parameters',
          'Debugging double-encoded values such as %2520 in API requests',
          'Preparing URLs with spaces or Unicode characters for curl or Postman',
        ]}
        faq={FAQ}
      />
    </>
  );
}
