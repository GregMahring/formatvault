import type { ReactNode } from 'react';
import { NavLink } from 'react-router';
import type { Route } from './+types/about';
import { buildMeta } from '@/lib/meta';

export { RouteErrorBoundary as ErrorBoundary } from '@/components/RouteErrorBoundary';

export function meta(_args: Route.MetaArgs) {
  return buildMeta({
    title: 'About formatvault — Private Browser-Native Developer Tools',
    description:
      'formatvault is a suite of developer tools that run entirely in your browser. No data uploaded, no accounts, no servers. Learn how it works and why we built it.',
    path: '/about',
    schemaType: 'WebPage',
  });
}

// ---------------------------------------------------------------------------
// Presentational helpers — scoped to this file
// ---------------------------------------------------------------------------

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-4 mt-10 border-b border-edge pb-2 text-lg font-semibold text-fg first:mt-0">
      {children}
    </h2>
  );
}

function Code({ children }: { children: ReactNode }) {
  return (
    <code className="rounded px-1 py-0.5 font-mono text-[0.85em] text-brand-cyan bg-[#00d4e8]/8">
      {children}
    </code>
  );
}

interface StackRowProps {
  label: string;
  value: string;
}

function StackRow({ label, value }: StackRowProps) {
  return (
    <div className="flex items-baseline gap-3 border-b border-edge py-2.5 last:border-0">
      <span className="w-40 shrink-0 text-xs font-medium uppercase tracking-wider text-fg-tertiary">
        {label}
      </span>
      <span className="text-sm text-fg-secondary">{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function About() {
  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-16">
      <h1 className="mb-2 text-3xl font-bold text-fg">About formatvault</h1>
      <p className="mb-10 text-sm text-fg-muted">
        Private developer tools. No uploads. No accounts.
      </p>

      {/* Mission callout */}
      <div className="mb-10 rounded-lg border border-[#5555cc]/30 bg-[#5555cc]/8 px-5 py-4">
        <div className="mb-3 flex items-center gap-2">
          <span
            className="inline-block h-[5px] w-[5px] shrink-0 rounded-full bg-[#aaaaff]"
            aria-hidden="true"
          />
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-[#aaaaff]">
            the mission
          </span>
        </div>
        <p className="text-sm leading-relaxed text-fg-secondary">
          Developer tools should not require you to trust a stranger's server with your data.
          formatvault is a suite of everyday utilities — formatters, converters, decoders — that run
          entirely inside your browser.{' '}
          <strong className="font-semibold text-fg">Your input never leaves your machine.</strong>{' '}
          Not when you format a JWT. Not when you convert a CSV. Not when you prettify a 100 MB JSON
          file. The data stays in your browser tab and disappears when you close it.
        </p>
      </div>

      {/* Why we built this */}
      <SectionHeading>Why we built this</SectionHeading>
      <p className="mb-4 leading-relaxed text-fg-secondary">
        Most online developer tools follow the same pattern: you paste your data into a textarea, it
        gets sent to a server for processing, and a result comes back. That's fine for public data.
        It's a problem for everything else.
      </p>
      <p className="mb-4 leading-relaxed text-fg-secondary">
        JWTs contain live session credentials. CSV exports contain customer records. JSON payloads
        from internal APIs contain database IDs, email addresses, and business logic. Pasting these
        into a random online tool means that data passes through infrastructure you have no insight
        into — even if the site says it deletes it immediately.
      </p>
      <p className="leading-relaxed text-fg-secondary">
        Modern browsers are powerful enough that server-side processing is simply not necessary for
        these tasks. formatvault takes the server out of the picture entirely.
      </p>

      {/* How it works */}
      <SectionHeading>How it works</SectionHeading>
      <p className="mb-4 leading-relaxed text-fg-secondary">
        formatvault is a static web application. When you visit a tool page, your browser downloads
        a self-contained JavaScript bundle from a CDN. From that point on, all processing runs
        locally in your browser tab using the same JavaScript engine your applications use.
      </p>
      <ul className="mb-4 space-y-3 text-fg-secondary">
        <li className="flex gap-3">
          <span className="mt-0.5 shrink-0 font-mono text-brand-indigo" aria-hidden="true">
            —
          </span>
          <span>
            <strong className="font-medium text-fg">No server round-trips for data.</strong> Every
            format, parse, validate, and convert operation executes locally. There is no backend
            that receives your input.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="mt-0.5 shrink-0 font-mono text-brand-indigo" aria-hidden="true">
            —
          </span>
          <span>
            <strong className="font-medium text-fg">Large files stay local.</strong> Files above 1
            MB are processed in a dedicated Web Worker using streaming parsers. A 200 MB CSV never
            leaves your machine — not even temporarily.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="mt-0.5 shrink-0 font-mono text-brand-indigo" aria-hidden="true">
            —
          </span>
          <span>
            <strong className="font-medium text-fg">Input content is never written to disk.</strong>{' '}
            Only UI preferences (theme, indent size) are saved to <Code>localStorage</Code>. Your
            data exists only in JavaScript memory and is discarded when you close the tab.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="mt-0.5 shrink-0 font-mono text-brand-indigo" aria-hidden="true">
            —
          </span>
          <span>
            <strong className="font-medium text-fg">Works offline.</strong> Once the page has
            loaded, all tools work without a network connection. The processing libraries are
            bundled with the app.
          </span>
        </li>
      </ul>
      <p className="leading-relaxed text-fg-secondary">
        You can verify all of this yourself. Open DevTools → Network, then use any tool. You'll see
        zero outbound requests for your data.
      </p>

      {/* The tools */}
      <SectionHeading>What's included</SectionHeading>
      <p className="mb-4 leading-relaxed text-fg-secondary">
        formatvault currently ships 27 tools across three categories:
      </p>
      <ul className="mb-4 space-y-2 text-fg-secondary">
        <li className="flex gap-3">
          <span className="mt-0.5 shrink-0 font-mono text-brand-indigo" aria-hidden="true">
            —
          </span>
          <span>
            <strong className="font-medium text-fg">Formatters & validators</strong> — JSON (with
            JSON5, JSONPath, and streaming up to 500 MB), CSV, YAML, TOML, and SQL (with
            multi-dialect support)
          </span>
        </li>
        <li className="flex gap-3">
          <span className="mt-0.5 shrink-0 font-mono text-brand-indigo" aria-hidden="true">
            —
          </span>
          <span>
            <strong className="font-medium text-fg">Format converters</strong> — all major pairs
            between JSON, CSV, YAML, and TOML, plus JSON → TypeScript interface generation
          </span>
        </li>
        <li className="flex gap-3">
          <span className="mt-0.5 shrink-0 font-mono text-brand-indigo" aria-hidden="true">
            —
          </span>
          <span>
            <strong className="font-medium text-fg">Utility tools</strong> — JWT decoder, Base64
            encoder/decoder, URL encoder/decoder, hash generator (MD5/SHA-256/SHA-512), regex
            tester, JSON Schema generator, color picker, Unix timestamp converter, cron explainer,
            and number base converter
          </span>
        </li>
      </ul>

      {/* Tech stack */}
      <SectionHeading>The technology</SectionHeading>
      <p className="mb-6 leading-relaxed text-fg-secondary">
        We believe in transparency. Here is exactly what runs inside your browser to process your
        data:
      </p>
      <div className="rounded-lg border border-edge bg-surface-raised px-4">
        <StackRow label="UI framework" value="React 19 + Vite + React Router v7" />
        <StackRow label="Styling" value="Tailwind CSS v4 with semantic dark/light tokens" />
        <StackRow
          label="JSON"
          value="Native JSON.parse / JSON.stringify; json5 for relaxed syntax; @streamparser/json for files ≥ 5 MB"
        />
        <StackRow label="CSV" value="PapaParse — streaming, Web Worker mode for large files" />
        <StackRow label="YAML" value="js-yaml" />
        <StackRow label="JWT" value="jose (decode only — no verification)" />
        <StackRow label="Base64" value="js-base64 (Unicode-safe)" />
        <StackRow label="Hashing" value="Web Crypto API (native browser, no library)" />
        <StackRow label="URL encoding" value="Native encodeURIComponent / decodeURIComponent" />
        <StackRow label="Code editor" value="CodeMirror 6 via @uiw/react-codemirror" />
        <StackRow label="Analytics" value="Plausible — cookieless, no personal data, EU-hosted" />
        <StackRow label="Hosting" value="Cloudflare Pages" />
      </div>

      {/* Commitment */}
      <SectionHeading>Our commitment</SectionHeading>
      <p className="mb-4 leading-relaxed text-fg-secondary">
        The client-side-only architecture is not a feature we can quietly remove later — it's
        structural. There is no server infrastructure to route your data through. We intend to keep
        it that way.
      </p>
      <p className="mb-4 leading-relaxed text-fg-secondary">
        We will never add server-side data processing, user accounts that store your input, or
        tracking that identifies individual users. If we ever add paid features, they will be for
        things that genuinely require a server (like saved workspaces that you explicitly opt into),
        and the free, private, local tools will remain free.
      </p>
      <p className="leading-relaxed text-fg-secondary">
        For a detailed breakdown of what analytics data we do collect (page view counts, no PII),
        see the{' '}
        <NavLink to="/privacy" className="text-brand-indigo underline-offset-2 hover:underline">
          Privacy Policy
        </NavLink>
        .
      </p>

      {/* Contact */}
      <SectionHeading>Contact</SectionHeading>
      <p className="leading-relaxed text-fg-secondary">
        Questions, bug reports, or tool requests — email{' '}
        <a
          href="mailto:hello@formatvault.dev"
          className="text-brand-indigo underline-offset-2 hover:underline"
        >
          hello@formatvault.dev
        </a>
        .
      </p>
    </div>
  );
}
