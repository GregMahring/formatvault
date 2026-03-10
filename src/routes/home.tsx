import { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  Braces,
  FileText,
  FileCode2,
  ArrowLeftRight,
  KeyRound,
  Lock,
  Globe,
  Hash,
  ShieldCheck,
  Zap,
  WifiOff,
  Sparkles,
  FileCheck2,
  Slash,
  Timer,
  CalendarClock,
} from 'lucide-react';
import type { Route } from './+types/home';
import { buildMeta } from '@/lib/meta';
import { detectFormat, getRouteForFormat, type DetectedFormat } from '@/lib/detectFormat';
import { useEditorStore } from '@/stores/editorStore';

export { RouteErrorBoundary as ErrorBoundary } from '@/components/RouteErrorBoundary';

export function meta(_args: Route.MetaArgs) {
  return buildMeta({
    title: 'formatvault — Free Developer Data Format Tools',
    description:
      'Free, privacy-first tools for formatting, validating, and converting JSON, CSV, YAML, and more. 100% client-side — no data ever leaves your browser.',
    path: '/',
    schemaType: 'WebPage',
  });
}

const TOOLS = [
  {
    to: '/json-formatter',
    icon: Braces,
    label: 'JSON Formatter',
    description: 'Pretty-print, minify, validate and query JSON with JSONPath',
    accent: 'text-yellow-400',
    badge: null as string | null,
  },
  {
    to: '/csv-formatter',
    icon: FileText,
    label: 'CSV Formatter',
    description: 'Format, validate and inspect CSV with automatic delimiter detection',
    accent: 'text-green-400',
    badge: null as string | null,
  },
  {
    to: '/yaml-formatter',
    icon: FileCode2,
    label: 'YAML Formatter',
    description: 'Format and validate YAML with line-level error reporting',
    accent: 'text-blue-400',
    badge: null as string | null,
  },
  {
    to: '/converters',
    icon: ArrowLeftRight,
    label: 'Converters',
    description: 'Convert between JSON, CSV, YAML and TypeScript — seven conversion pairs',
    accent: 'text-purple-400',
    badge: '7 pairs' as string | null,
  },
  {
    to: '/json-schema-generator',
    icon: FileCheck2,
    label: 'JSON Schema',
    description: 'Generate JSON Schema from data and validate JSON against schemas',
    accent: 'text-emerald-400',
    badge: null as string | null,
  },
  {
    to: '/jwt-decoder',
    icon: KeyRound,
    label: 'JWT Decoder',
    description: 'Decode JWT tokens and inspect header, payload and expiry',
    accent: 'text-orange-400',
    badge: null as string | null,
  },
  {
    to: '/base64-encoder',
    icon: Lock,
    label: 'Base64',
    description: 'Encode and decode Base64 strings with full Unicode support',
    accent: 'text-pink-400',
    badge: null as string | null,
  },
  {
    to: '/url-encoder',
    icon: Globe,
    label: 'URL Encoder',
    description: 'URL-encode and decode strings and query parameters',
    accent: 'text-cyan-400',
    badge: null as string | null,
  },
  {
    to: '/regex-tester',
    icon: Slash,
    label: 'Regex Tester',
    description: 'Test regular expressions with real-time match highlighting and capture groups',
    accent: 'text-rose-400',
    badge: null as string | null,
  },
  {
    to: '/hash-generator',
    icon: Hash,
    label: 'Hash Generator',
    description: 'Generate MD5, SHA-256, and SHA-512 hashes from text or files',
    accent: 'text-violet-400',
    badge: null as string | null,
  },
  {
    to: '/unix-timestamp-converter',
    icon: Timer,
    label: 'Timestamp Converter',
    description: 'Convert Unix timestamps to dates and back. Auto-detects seconds vs milliseconds',
    accent: 'text-amber-400',
    badge: null as string | null,
  },
  {
    to: '/cron-expression-explainer',
    icon: CalendarClock,
    label: 'Cron Explainer',
    description:
      'Explain cron expressions in plain English with next run times and field breakdown',
    accent: 'text-teal-400',
    badge: null as string | null,
  },
];

const FEATURES = [
  {
    icon: ShieldCheck,
    label: '100% client-side',
    description: 'All processing happens in your browser. Your data never touches a server.',
  },
  {
    icon: WifiOff,
    label: 'Works offline',
    description: 'No external API calls. Paste your data and format — no internet required.',
  },
  {
    icon: Zap,
    label: 'Instant results',
    description: 'Auto-formats as you type with a short debounce. No submit button needed.',
  },
];

const FORMAT_LABELS: Record<DetectedFormat, string> = {
  json: 'JSON',
  json5: 'JSON5 (relaxed)',
  csv: 'CSV',
  yaml: 'YAML',
  toml: 'TOML',
  sql: 'SQL',
  jwt: 'JWT',
  base64: 'Base64',
  'url-encoded': 'URL-encoded',
  unknown: 'Unknown',
};

export default function Home() {
  const navigate = useNavigate();
  const [detected, setDetected] = useState<DetectedFormat | null>(null);
  const [pasteValue, setPasteValue] = useState('');

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const pasted = e.clipboardData.getData('text');
      if (!pasted.trim()) return;

      setPasteValue(pasted);
      const result = detectFormat(pasted);

      if (result.primary !== 'unknown') {
        setDetected(result.primary);

        // Store input in editorStore for the target route to pick up
        useEditorStore.getState().setInput(pasted);

        const route = getRouteForFormat(result.primary);
        if (route) {
          // Short delay so the user sees the detected badge before navigating
          setTimeout(() => {
            void navigate(route);
          }, 400);
        }
      } else {
        setDetected('unknown');
      }
    },
    [navigate]
  );

  const handleManualNav = useCallback(
    (format: DetectedFormat) => {
      useEditorStore.getState().setInput(pasteValue);
      const route = getRouteForFormat(format);
      if (route) void navigate(route);
    },
    [navigate, pasteValue]
  );

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-16">
      {/* Hero */}
      <div className="mb-16">
        {/* Hero logo — $ {format:vault}█ at xl size, centered */}
        <div className="mb-8 flex justify-center">
          <div className="inline-flex items-center font-mono">
            <span className="text-[38px] font-bold text-brand-indigo mr-[11px] leading-none">
              $
            </span>
            <span className="text-[38px] font-normal text-logo-cyan leading-none">{'{'}</span>
            <span className="text-[38px] font-bold text-logo-silver leading-none">format</span>
            <span className="text-[38px] font-bold text-logo-colon leading-none">:</span>
            <span className="text-[38px] font-bold text-logo-silver leading-none">vault</span>
            <span className="text-[38px] font-normal text-logo-cyan leading-none">{'}'}</span>
            <span className="fv-cursor ml-[3px] inline-block w-[2px] h-[34px] bg-brand-indigo" />
          </div>
        </div>

        {/* Badge, headline, body, textarea, buttons — all left-aligned in shared container */}
        <div className="mx-auto max-w-2xl">
          <div className="mb-4 flex items-center gap-2 rounded border border-[#5555cc]/30 bg-[#5555cc]/10 px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-[#aaaaff]">
            <span
              className="inline-block h-[5px] w-[5px] shrink-0 rounded-full bg-[#aaaaff]"
              aria-hidden="true"
            />
            browser-local processing
          </div>

          <h1
            className="mb-4 font-display text-4xl font-extrabold text-fg sm:text-5xl"
            style={{ letterSpacing: '-0.02em', lineHeight: '1.05' }}
          >
            Format anything.
            <br />
            <span className="text-logo-cyan">Share nothing.</span>
          </h1>
          <p className="mb-8 text-[15px] leading-[1.65] text-fg-secondary">
            Clean, convert, and generate data formats — JSON, CSV, TOML, SQL, and more. All
            processing stays in your browser.
            <br />
            <strong className="font-semibold text-fg">Zero uploads. Zero exposure.</strong>
          </p>

          {/* Auto-detect paste area */}
          <div className="relative">
            <textarea
              value={pasteValue}
              onChange={(e) => {
                setPasteValue(e.target.value);
                setDetected(null);
              }}
              onPaste={handlePaste}
              placeholder="Paste any data here — we'll detect the format automatically…"
              className="h-24 w-full resize-none rounded-lg border border-edge-emphasis bg-surface-raised px-4 py-3 font-mono text-sm text-fg placeholder:text-fg-muted focus:border-[#5555cc] focus:outline-none focus:ring-1 focus:ring-[#5555cc]"
              spellCheck={false}
              aria-label="Paste data for auto-detection"
            />
            <div className="absolute right-3 top-3">
              <Sparkles className="h-4 w-4 text-fg-muted" aria-hidden="true" />
            </div>
          </div>

          {/* Detection result */}
          {detected && detected !== 'unknown' && (
            <div className="mt-2 flex items-center gap-2 text-sm">
              <span className="rounded-full bg-[#5555cc]/15 px-2.5 py-0.5 text-xs font-medium text-[#7777dd]">
                Detected: {FORMAT_LABELS[detected]}
              </span>
              <span className="text-xs text-fg-muted">Navigating...</span>
            </div>
          )}

          {detected === 'unknown' && (
            <div className="mt-3">
              <p className="mb-2 text-xs text-fg-muted">
                Couldn't auto-detect the format. Pick a tool:
              </p>
              <div className="flex flex-wrap gap-2">
                {(['json', 'csv', 'yaml', 'jwt', 'base64', 'url-encoded'] as DetectedFormat[]).map(
                  (fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => {
                        handleManualNav(fmt);
                      }}
                      className="rounded-md border border-edge-emphasis bg-surface-raised px-3 py-1 text-xs text-fg-secondary transition-colors hover:border-edge hover:text-fg"
                    >
                      {FORMAT_LABELS[fmt]}
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-center gap-3">
            <Link
              to="/json-formatter"
              className="flex-1 rounded-lg bg-[#5555cc] px-5 py-2 text-center text-sm font-semibold text-white transition-colors hover:bg-[#6666dd] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5555cc]"
            >
              Start Formatting
            </Link>
            <Link
              to="/converters"
              className="flex-1 rounded-lg border border-edge-emphasis bg-surface-raised px-5 py-2 text-center text-sm font-semibold text-fg-secondary transition-colors hover:border-[#5555cc]/50 hover:bg-surface-elevated hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5555cc]"
            >
              See all converters
            </Link>
          </div>
        </div>
      </div>

      {/* Feature strip */}
      <div className="mb-12 grid grid-cols-1 divide-y divide-edge sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {FEATURES.map(({ icon: Icon, label, description }) => (
          <div key={label} className="flex gap-3 px-0 py-5 sm:px-6 sm:first:pl-0 sm:last:pr-0">
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-brand-cyan" aria-hidden="true" />
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-fg">
                {label}
              </span>
              <p className="text-xs leading-relaxed text-fg-tertiary">{description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tool grid */}
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-fg-muted">
        Available tools
      </h2>
      <ul
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
        aria-label="Available tools"
      >
        {TOOLS.map(({ to, icon: Icon, label, description, accent, badge }) => (
          <li key={to}>
            <Link
              to={to}
              className="group flex h-full flex-col gap-2 rounded-lg border border-edge bg-surface-raised p-5 transition-colors hover:border-[#5555cc]/40 hover:bg-surface-elevated/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5555cc]"
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-5 w-5 shrink-0 ${accent}`} aria-hidden="true" />
                <span className="flex-1 font-semibold text-fg group-hover:text-fg">{label}</span>
                {badge !== null && (
                  <span className="rounded-full border border-edge-emphasis bg-surface-elevated px-2 py-0.5 text-[10px] font-medium text-fg-secondary">
                    {badge}
                  </span>
                )}
              </div>
              <p className="text-sm leading-relaxed text-fg-tertiary group-hover:text-fg-secondary">
                {description}
              </p>
            </Link>
          </li>
        ))}
      </ul>

      {/* Privacy callout */}
      <div className="mt-12 flex flex-col items-center gap-2 rounded-lg border border-edge bg-surface-raised/40 px-6 py-5 text-center">
        <ShieldCheck className="h-6 w-6 text-green-500" aria-hidden="true" />
        <p className="text-sm font-semibold text-fg-secondary">Your data stays on your device</p>
        <p className="max-w-md text-xs leading-relaxed text-fg-muted">
          Every tool on formatvault runs entirely in your browser. No data is ever uploaded, stored,
          or logged. Paste sensitive credentials, tokens, and payloads with confidence.
        </p>
      </div>
    </div>
  );
}
