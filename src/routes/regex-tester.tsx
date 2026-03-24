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
    title: 'Regex Tester — Test Regular Expressions, No Upload',
    description:
      'Test regular expressions privately in your browser — no data sent anywhere. Real-time match highlighting, all JS flags (g, i, m, s, u, d), named capture groups, and multi-match display.',
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
      <div className="flex flex-wrap items-center gap-2 border-b border-edge bg-surface px-4 py-2">
        <h1 className="text-sm font-semibold text-fg">Regex Tester</h1>
        <div className="h-4 w-px bg-surface-elevated" aria-hidden="true" />

        {/* Pattern input with / decorations */}
        <div className="flex items-center gap-0 font-mono">
          <span className="select-none text-sm text-fg-tertiary">/</span>
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
                : 'border-edge-emphasis text-fg placeholder-fg-muted focus:border-accent-500'
            )}
          />
          <span className="select-none text-sm text-fg-tertiary">/</span>
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
                  : 'text-fg-tertiary hover:bg-surface-elevated hover:text-fg-secondary'
              )}
            >
              {letter}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* Match count badge */}
        {hasPattern && hasInput && !result.error && (
          <Badge variant={matchCount === 0 ? 'secondary' : 'success'} dot={matchCount > 0}>
            {matchCount === 0
              ? 'no matches'
              : `${String(matchCount)} match${matchCount !== 1 ? 'es' : ''}`}
          </Badge>
        )}

        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-3 text-xs text-fg-secondary"
          onClick={clear}
          disabled={!pattern && !input}
        >
          Clear
        </Button>

        <button
          type="button"
          className="rounded p-1 text-fg-tertiary hover:bg-surface-elevated hover:text-fg-secondary"
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
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        {/* Left pane — test string */}
        <div className="flex w-full flex-col border-b border-r-0 border-edge md:w-1/2 md:border-b-0 md:border-r">
          <div className="flex items-center border-b border-edge px-3 py-1.5">
            <span className="text-[11px] font-medium uppercase tracking-wide text-fg-tertiary">
              Test string
            </span>
          </div>
          <textarea
            className="flex-1 resize-none bg-surface p-4 font-mono text-sm text-fg placeholder-fg-muted focus:outline-none"
            placeholder="Paste or type text to test against…"
            value={input}
            onChange={(e) => {
              setInputRaw(e.target.value);
            }}
            spellCheck={false}
            aria-label="Test string input"
          />
          {input && (
            <div className="border-t border-edge px-3 py-1.5 text-[10px] text-fg-muted">
              {String(input.length)} chars
            </div>
          )}
        </div>

        {/* Right pane — match results */}
        <div className="flex w-full flex-col md:w-1/2">
          <div className="flex items-center justify-between border-b border-edge px-3 py-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium uppercase tracking-wide text-fg-tertiary">
                Match results
              </span>
              {hasPattern && hasInput && !result.error && matchCount > 0 && (
                <Badge variant="success" dot>
                  {String(matchCount)}
                </Badge>
              )}
            </div>
            <PaneActions content={copyContent} downloadFilename="regex-matches.txt" />
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* State 1: no pattern entered */}
            {!hasPattern && (
              <div className="flex h-full items-center justify-center text-xs text-fg-muted">
                Enter a pattern above…
              </div>
            )}

            {/* State 3: no matches (pattern entered, no error, zero matches) */}
            {hasPattern && !result.error && matchCount === 0 && (
              <div className="flex h-full items-center justify-center text-xs text-fg-muted">
                {hasInput ? 'No matches found' : 'Enter test text on the left…'}
              </div>
            )}

            {/* State 2: matches found — highlighted text + detail list */}
            {hasPattern && !result.error && matchCount > 0 && safeHighlightHtml && (
              <div className="flex flex-col">
                {/* Highlighted text */}
                <div
                  className="border-b border-edge bg-surface-raised p-4 font-mono text-sm leading-relaxed text-fg-secondary
                    [&_mark]:rounded-sm [&_mark]:bg-yellow-400/25 [&_mark]:text-yellow-200 [&_mark]:ring-1 [&_mark]:ring-yellow-400/40"
                  // DOMPurify-sanitized HTML — safe per ADR-0008
                  dangerouslySetInnerHTML={{ __html: safeHighlightHtml }}
                />

                {/* Match detail list */}
                <ul className="divide-y divide-edge bg-surface">
                  {result.matches?.map((m, i) => (
                    <li key={i} className="px-4 py-2.5 text-xs">
                      <div className="flex items-baseline gap-2">
                        <span className="shrink-0 font-mono text-[10px] text-fg-muted">
                          #{i + 1}
                        </span>
                        <span className="font-mono text-fg break-all">{m.value || '(empty)'}</span>
                        <span className="ml-auto shrink-0 text-[10px] text-fg-muted">
                          {String(m.index)}–{String(m.end)}
                        </span>
                      </div>
                      {/* Capture groups */}
                      {m.namedGroups && (
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 pl-6">
                          {Object.entries(m.namedGroups).map(([name, val]) => (
                            <span key={name} className="text-[10px] text-fg-muted">
                              <span className="text-accent-400">{name}</span>:{' '}
                              <span className="font-mono text-fg-secondary">
                                {val !== undefined ? `"${val}"` : 'undefined'}
                              </span>
                            </span>
                          ))}
                        </div>
                      )}
                      {!m.namedGroups && m.groups.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 pl-6">
                          {m.groups.map((g, gi) => (
                            <span key={gi} className="text-[10px] text-fg-muted">
                              <span className="text-accent-400">${String(gi + 1)}</span>:{' '}
                              <span className="font-mono text-fg-secondary">
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
