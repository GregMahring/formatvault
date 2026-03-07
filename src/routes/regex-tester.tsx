import type { Route } from './+types/regex-tester';
import { buildMeta } from '@/lib/meta';
import { useState, useEffect, useCallback, useMemo } from 'react';
import DOMPurify from 'dompurify';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PaneActions } from '@/components/PaneActions';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useRegisterCommands } from '@/hooks/useRegisterCommands';
import { type Command } from '@/stores/commandStore';
import { KeyboardShortcutsModal } from '@/components/KeyboardShortcutsModal';
import { useEditorStore } from '@/stores/editorStore';
import {
  testRegex,
  highlightMatches,
  DEFAULT_FLAGS,
  type RegexFlags,
} from '@/features/tools/regexTester';
import { Keyboard } from 'lucide-react';
import { cn } from '@/lib/utils';

export { RouteErrorBoundary as ErrorBoundary } from '@/components/RouteErrorBoundary';

export function meta(_args: Route.MetaArgs) {
  return buildMeta({
    title: 'Regex Tester — Test Regular Expressions Online',
    description:
      'Test regular expressions with real-time match highlighting. Supports all JS regex flags (g, i, m, s, u, d), named capture groups, and multi-match display. 100% client-side.',
    path: '/regex-tester',
  });
}

const FLAG_DEFS: { key: keyof RegexFlags; letter: string; title: string }[] = [
  { key: 'global', letter: 'g', title: 'Global — find all matches' },
  { key: 'ignoreCase', letter: 'i', title: 'Case-insensitive' },
  { key: 'multiline', letter: 'm', title: 'Multiline — ^ and $ match line boundaries' },
  { key: 'dotAll', letter: 's', title: 'Dot-all — . matches newlines' },
  { key: 'unicode', letter: 'u', title: 'Unicode — enable full Unicode mode' },
  { key: 'hasIndices', letter: 'd', title: 'Indices — expose match index ranges' },
];

export default function RegexTester() {
  const [pattern, setPattern] = useState('');
  const [flags, setFlags] = useState<RegexFlags>(DEFAULT_FLAGS);
  const [input, setInputRaw] = useState('');
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Load pre-loaded input from the landing page paste flow
  useEffect(() => {
    const preloaded = useEditorStore.getState().input;
    if (preloaded) {
      setInputRaw(preloaded);
      useEditorStore.getState().reset();
    }
  }, []);

  const result = useMemo(() => testRegex(pattern, flags, input), [pattern, flags, input]);

  const safeHighlightHtml = useMemo(() => {
    if (!result.matches || result.matches.length === 0) return null;
    const raw = highlightMatches(input, result.matches);
    return DOMPurify.sanitize(raw, { ALLOWED_TAGS: ['mark'], ALLOWED_ATTR: [] });
  }, [result, input]);

  const copyContent = useMemo(() => {
    if (!result.matches || result.matches.length === 0) return '';
    return result.matches
      .map((m, i) => `Match ${String(i + 1)}: "${m.value}" at ${String(m.index)}–${String(m.end)}`)
      .join('\n');
  }, [result]);

  const toggleFlag = useCallback((key: keyof RegexFlags) => {
    setFlags((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const clear = useCallback(() => {
    setPattern('');
    setInputRaw('');
  }, []);

  const shortcuts = [
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
        id: 'action:clear',
        label: 'Clear',
        group: 'Actions',
        shortcut: '⌘ ⇧ K',
        handler: clear,
      },
    ],
    [clear]
  );
  useRegisterCommands(commands);

  const matchCount = result.matches?.length ?? 0;
  const hasPattern = pattern.length > 0;
  const hasInput = input.length > 0;

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-800 bg-gray-950 px-4 py-2">
        <h1 className="text-sm font-semibold text-gray-200">Regex Tester</h1>
        <div className="h-4 w-px bg-gray-800" aria-hidden="true" />

        {/* Pattern input with / decorations */}
        <div className="flex items-center gap-0 font-mono">
          <span className="select-none text-sm text-gray-500">/</span>
          <input
            type="text"
            value={pattern}
            onChange={(e) => {
              setPattern(e.target.value);
            }}
            placeholder="pattern"
            spellCheck={false}
            aria-label="Regular expression pattern"
            className={cn(
              'w-48 rounded-none border-b bg-transparent px-1 py-0.5 font-mono text-sm focus:outline-none',
              result.error
                ? 'border-red-600 text-red-300 placeholder-red-900'
                : 'border-gray-700 text-gray-200 placeholder-gray-600 focus:border-accent-500'
            )}
          />
          <span className="select-none text-sm text-gray-500">/</span>
        </div>

        {/* Flag toggles */}
        <div className="flex items-center gap-0.5">
          {FLAG_DEFS.map(({ key, letter, title }) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                toggleFlag(key);
              }}
              title={title}
              aria-pressed={flags[key]}
              className={cn(
                'rounded px-2 py-1 font-mono text-xs font-medium transition-colors',
                flags[key]
                  ? 'bg-accent-600/30 text-accent-300 ring-1 ring-accent-500/50'
                  : 'text-gray-500 hover:bg-gray-800 hover:text-gray-400'
              )}
            >
              {letter}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* Match count badge */}
        {hasPattern && hasInput && !result.error && (
          <Badge variant="default" className="text-xs">
            {matchCount === 0
              ? 'No matches'
              : `${String(matchCount)} match${matchCount !== 1 ? 'es' : ''}`}
          </Badge>
        )}

        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-3 text-xs text-gray-400"
          onClick={clear}
          disabled={!pattern && !input}
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
      {result.error && (
        <div
          role="alert"
          className="flex items-start gap-2 border-b border-red-900/60 bg-red-950/40 px-4 py-2 text-xs text-red-400"
        >
          <span className="shrink-0 font-mono font-semibold">Error</span>
          <span className="flex-1">{result.error}</span>
        </div>
      )}

      {/* Split layout */}
      <div className="flex min-h-0 flex-1">
        {/* Left pane — test string */}
        <div className="flex w-1/2 flex-col border-r border-gray-800">
          <div className="flex items-center border-b border-gray-800 px-3 py-1.5">
            <span className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
              Test string
            </span>
          </div>
          <textarea
            className="flex-1 resize-none bg-gray-950 p-4 font-mono text-sm text-gray-200 placeholder-gray-700 focus:outline-none"
            placeholder="Paste or type text to test against…"
            value={input}
            onChange={(e) => {
              setInputRaw(e.target.value);
            }}
            spellCheck={false}
            aria-label="Test string input"
          />
          {input && (
            <div className="border-t border-gray-800 px-3 py-1.5 text-[10px] text-gray-700">
              {String(input.length)} chars
            </div>
          )}
        </div>

        {/* Right pane — match results */}
        <div className="flex w-1/2 flex-col">
          <div className="flex items-center justify-between border-b border-gray-800 px-3 py-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                Match results
              </span>
              {hasPattern && hasInput && !result.error && matchCount > 0 && (
                <Badge variant="default" className="text-[10px]">
                  {String(matchCount)}
                </Badge>
              )}
            </div>
            <PaneActions content={copyContent} downloadFilename="regex-matches.txt" />
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* State 1: no pattern entered */}
            {!hasPattern && (
              <div className="flex h-full items-center justify-center text-xs text-gray-700">
                Enter a pattern above…
              </div>
            )}

            {/* State 3: no matches (pattern entered, no error, zero matches) */}
            {hasPattern && !result.error && matchCount === 0 && (
              <div className="flex h-full items-center justify-center text-xs text-gray-700">
                {hasInput ? 'No matches found' : 'Enter test text on the left…'}
              </div>
            )}

            {/* State 2: matches found — highlighted text + detail list */}
            {hasPattern && !result.error && matchCount > 0 && safeHighlightHtml && (
              <div className="flex flex-col">
                {/* Highlighted text */}
                <div
                  className="border-b border-gray-800 bg-gray-900 p-4 font-mono text-sm leading-relaxed text-gray-300
                    [&_mark]:rounded-sm [&_mark]:bg-yellow-400/25 [&_mark]:text-yellow-200 [&_mark]:ring-1 [&_mark]:ring-yellow-400/40"
                  // DOMPurify-sanitized HTML — safe per ADR-0008
                  dangerouslySetInnerHTML={{ __html: safeHighlightHtml }}
                />

                {/* Match detail list */}
                <ul className="divide-y divide-gray-800/60 bg-gray-950">
                  {result.matches?.map((m, i) => (
                    <li key={i} className="px-4 py-2.5 text-xs">
                      <div className="flex items-baseline gap-2">
                        <span className="shrink-0 font-mono text-[10px] text-gray-600">
                          #{i + 1}
                        </span>
                        <span className="font-mono text-gray-200 break-all">
                          {m.value || '(empty)'}
                        </span>
                        <span className="ml-auto shrink-0 text-[10px] text-gray-600">
                          {String(m.index)}–{String(m.end)}
                        </span>
                      </div>
                      {/* Capture groups */}
                      {m.namedGroups && (
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 pl-6">
                          {Object.entries(m.namedGroups).map(([name, val]) => (
                            <span key={name} className="text-[10px] text-gray-600">
                              <span className="text-accent-400">{name}</span>:{' '}
                              <span className="font-mono text-gray-400">
                                {val !== undefined ? `"${val}"` : 'undefined'}
                              </span>
                            </span>
                          ))}
                        </div>
                      )}
                      {!m.namedGroups && m.groups.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 pl-6">
                          {m.groups.map((g, gi) => (
                            <span key={gi} className="text-[10px] text-gray-600">
                              <span className="text-accent-400">${String(gi + 1)}</span>:{' '}
                              <span className="font-mono text-gray-400">
                                {g !== undefined ? `"${g}"` : 'undefined'}
                              </span>
                            </span>
                          ))}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Error state — no matches shown */}
            {result.error && (
              <div className="flex h-full items-center justify-center text-xs text-red-600">
                Fix the pattern error above
              </div>
            )}
          </div>
        </div>
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
