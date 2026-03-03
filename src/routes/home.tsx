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
      <div className="mb-16 text-center">
        <div className="mb-4 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-accent-500/30 bg-accent-500/10">
            <Braces className="h-8 w-8 text-accent-400" aria-hidden="true" />
          </div>
        </div>

        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-gray-700 bg-gray-900 px-3 py-1 text-xs font-medium text-gray-400">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-400" aria-hidden="true" />
          Free · No account · No tracking
        </div>

        <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-100 sm:text-5xl">
          Developer data format tools
        </h1>
        <p className="mx-auto max-w-xl text-lg text-gray-400">
          Format, validate and convert JSON, CSV, YAML and more — completely free, with{' '}
          <strong className="font-semibold text-gray-200">no data ever leaving your browser</strong>
          .
        </p>

        {/* Auto-detect paste area */}
        <div className="mx-auto mt-8 max-w-lg">
          <div className="relative">
            <textarea
              value={pasteValue}
              onChange={(e) => {
                setPasteValue(e.target.value);
                setDetected(null);
              }}
              onPaste={handlePaste}
              placeholder="Paste any data here — we'll detect the format automatically…"
              className="h-24 w-full resize-none rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 font-mono text-sm text-gray-200 placeholder:text-gray-600 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
              spellCheck={false}
              aria-label="Paste data for auto-detection"
            />
            <div className="absolute right-3 top-3">
              <Sparkles className="h-4 w-4 text-gray-700" aria-hidden="true" />
            </div>
          </div>

          {/* Detection result */}
          {detected && detected !== 'unknown' && (
            <div className="mt-2 flex items-center justify-center gap-2 text-sm">
              <span className="rounded-full bg-accent-600/20 px-2.5 py-0.5 text-xs font-medium text-accent-300">
                Detected: {FORMAT_LABELS[detected]}
              </span>
              <span className="text-xs text-gray-600">Navigating...</span>
            </div>
          )}

          {detected === 'unknown' && (
            <div className="mt-3">
              <p className="mb-2 text-xs text-gray-600">
                Couldn't auto-detect the format. Pick a tool:
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {(['json', 'csv', 'yaml', 'jwt', 'base64', 'url-encoded'] as DetectedFormat[]).map(
                  (fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => {
                        handleManualNav(fmt);
                      }}
                      className="rounded-md border border-gray-700 bg-gray-900 px-3 py-1 text-xs text-gray-400 transition-colors hover:border-gray-600 hover:text-gray-200"
                    >
                      {FORMAT_LABELS[fmt]}
                    </button>
                  )
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            to="/json-formatter"
            className="rounded-lg bg-accent-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
          >
            Try JSON Formatter
          </Link>
          <Link
            to="/converters"
            className="rounded-lg border border-gray-700 bg-gray-900 px-5 py-2 text-sm font-semibold text-gray-300 transition-colors hover:border-gray-600 hover:bg-gray-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
          >
            See all converters
          </Link>
        </div>
      </div>

      {/* Feature strip */}
      <div className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {FEATURES.map(({ icon: Icon, label, description }) => (
          <div
            key={label}
            className="flex flex-col gap-2 rounded-lg border border-gray-800 bg-gray-900/50 p-4"
          >
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-accent-400" aria-hidden="true" />
              <span className="text-sm font-semibold text-gray-200">{label}</span>
            </div>
            <p className="text-xs leading-relaxed text-gray-500">{description}</p>
          </div>
        ))}
      </div>

      {/* Tool grid */}
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-600">
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
              className="group flex flex-col gap-2 rounded-lg border border-gray-800 bg-gray-900 p-5 transition-colors hover:border-gray-700 hover:bg-gray-800/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-5 w-5 shrink-0 ${accent}`} aria-hidden="true" />
                <span className="flex-1 font-semibold text-gray-100 group-hover:text-white">
                  {label}
                </span>
                {badge !== null && (
                  <span className="rounded-full border border-gray-700 bg-gray-800 px-2 py-0.5 text-[10px] font-medium text-gray-400">
                    {badge}
                  </span>
                )}
              </div>
              <p className="text-sm leading-relaxed text-gray-500 group-hover:text-gray-400">
                {description}
              </p>
            </Link>
          </li>
        ))}
      </ul>

      {/* Privacy callout */}
      <div className="mt-12 flex flex-col items-center gap-2 rounded-lg border border-gray-800 bg-gray-900/40 px-6 py-5 text-center">
        <ShieldCheck className="h-6 w-6 text-green-500" aria-hidden="true" />
        <p className="text-sm font-semibold text-gray-300">Your data stays on your device</p>
        <p className="max-w-md text-xs leading-relaxed text-gray-600">
          Every tool on formatvault runs entirely in your browser. No data is ever uploaded, stored,
          or logged. Paste sensitive credentials, tokens, and payloads with confidence.
        </p>
      </div>
    </div>
  );
}
