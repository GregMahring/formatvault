import { Link } from 'react-router';
import { Braces, FileText, FileCode2, ArrowLeftRight, KeyRound, Lock, Globe } from 'lucide-react';
import type { Route } from './+types/home';

export function meta(_args: Route.MetaArgs) {
  return [
    { title: 'formatvault — Free Developer Data Format Tools' },
    {
      name: 'description',
      content:
        'Free, privacy-first tools for formatting, validating, and converting JSON, CSV, YAML, and more. 100% client-side — no data ever leaves your browser.',
    },
    { property: 'og:title', content: 'formatvault — Free Developer Data Format Tools' },
    {
      property: 'og:description',
      content: 'Format, validate and convert data formats. No data leaves your browser.',
    },
  ];
}

const TOOLS = [
  {
    to: '/json-formatter',
    icon: Braces,
    label: 'JSON Formatter',
    description: 'Pretty-print, minify, validate and query JSON',
    accent: 'text-yellow-400',
  },
  {
    to: '/csv-formatter',
    icon: FileText,
    label: 'CSV Formatter',
    description: 'Format, validate and inspect CSV with delimiter detection',
    accent: 'text-green-400',
  },
  {
    to: '/yaml-formatter',
    icon: FileCode2,
    label: 'YAML Formatter',
    description: 'Format and validate YAML with line-level error reporting',
    accent: 'text-blue-400',
  },
  {
    to: '/converters',
    icon: ArrowLeftRight,
    label: 'Converters',
    description: 'Convert between JSON, CSV and YAML — all six pairs',
    accent: 'text-purple-400',
  },
  {
    to: '/jwt-decoder',
    icon: KeyRound,
    label: 'JWT Decoder',
    description: 'Decode JWT tokens and inspect header, payload and expiry',
    accent: 'text-orange-400',
  },
  {
    to: '/base64-encoder',
    icon: Lock,
    label: 'Base64',
    description: 'Encode and decode Base64 strings with Unicode support',
    accent: 'text-pink-400',
  },
  {
    to: '/url-encoder',
    icon: Globe,
    label: 'URL Encoder',
    description: 'URL-encode and decode strings for safe use in requests',
    accent: 'text-cyan-400',
  },
] as const;

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-16">
      {/* Hero */}
      <div className="mb-16 text-center">
        <div className="mb-4 flex justify-center">
          <Braces className="h-10 w-10 text-accent-400" aria-hidden="true" />
        </div>
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-100">
          Developer data format tools
        </h1>
        <p className="mx-auto max-w-xl text-lg text-gray-400">
          Format, validate and convert JSON, CSV, YAML and more — completely free, with{' '}
          <strong className="font-semibold text-gray-200">no data ever leaving your browser</strong>
          .
        </p>
      </div>

      {/* Tool grid */}
      <ul
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
        aria-label="Available tools"
      >
        {TOOLS.map(({ to, icon: Icon, label, description, accent }) => (
          <li key={to}>
            <Link
              to={to}
              className="group flex flex-col gap-2 rounded-lg border border-gray-800 bg-gray-900 p-5 transition-colors hover:border-gray-700 hover:bg-gray-800/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-5 w-5 shrink-0 ${accent}`} aria-hidden="true" />
                <span className="font-semibold text-gray-100 group-hover:text-white">{label}</span>
              </div>
              <p className="text-sm leading-relaxed text-gray-500 group-hover:text-gray-400">
                {description}
              </p>
            </Link>
          </li>
        ))}
      </ul>

      {/* Privacy callout */}
      <p className="mt-12 text-center text-sm text-gray-600">
        🔒 All processing happens in your browser. No server, no storage, no tracking.
      </p>
    </div>
  );
}
