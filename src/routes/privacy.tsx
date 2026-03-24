import type { ReactNode } from 'react';
import type { Route } from './+types/privacy';
import { buildMeta } from '@/lib/meta';

export { RouteErrorBoundary as ErrorBoundary } from '@/components/RouteErrorBoundary';

export function meta(_args: Route.MetaArgs) {
  return buildMeta({
    title: 'Privacy Policy',
    description:
      'formatvault processes everything in your browser. No input data is ever transmitted, stored, or logged. Read what we do and do not collect.',
    path: '/privacy',
    schemaType: 'WebPage',
  });
}

// ---------------------------------------------------------------------------
// Small presentational helpers — scoped to this file, not exported
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

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-brand-indigo underline-offset-2 hover:underline"
    >
      {children}
    </a>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function Privacy() {
  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-16">
      <h1 className="mb-2 text-3xl font-bold text-fg">Privacy Policy</h1>
      <p className="mb-10 text-sm text-fg-muted">Last updated: 2026-03-23</p>

      {/* Short version callout — brand-indigo tinted, mirrors the homepage badge style */}
      <div className="mb-10 rounded-lg border border-[#5555cc]/30 bg-[#5555cc]/8 px-5 py-4">
        <div className="mb-3 flex items-center gap-2">
          <span
            className="inline-block h-[5px] w-[5px] shrink-0 rounded-full bg-[#aaaaff]"
            aria-hidden="true"
          />
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-[#aaaaff]">
            the short version
          </span>
        </div>
        <ul className="space-y-2 text-sm leading-relaxed text-fg-secondary">
          <li className="flex gap-2">
            <span className="mt-0.5 shrink-0 text-brand-indigo" aria-hidden="true">
              —
            </span>
            <span>
              <strong className="font-semibold text-fg">We never see your data.</strong> Every
              format, conversion, and decode operation runs entirely inside your browser using
              JavaScript. Nothing is uploaded anywhere.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="mt-0.5 shrink-0 text-brand-indigo" aria-hidden="true">
              —
            </span>
            <span>
              <strong className="font-semibold text-fg">We collect no personal data.</strong> We use
              Plausible Analytics — a privacy-respecting, cookieless counter that records only
              aggregate page view counts. No fingerprinting, no cross-site tracking.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="mt-0.5 shrink-0 text-brand-indigo" aria-hidden="true">
              —
            </span>
            <span>
              <strong className="font-semibold text-fg">
                <Code>localStorage</Code> stores only UI preferences
              </strong>{' '}
              — theme and indent size. Your input content is never written to disk.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="mt-0.5 shrink-0 text-brand-indigo" aria-hidden="true">
              —
            </span>
            <span>
              <strong className="font-semibold text-fg">GDPR and CCPA rights are trivial</strong>{' '}
              here — there is no personal data to delete, export, or correct.
            </span>
          </li>
        </ul>
      </div>

      {/* What we collect */}
      <SectionHeading>What we collect</SectionHeading>
      <p className="mb-4 leading-relaxed text-fg-secondary">
        We collect nothing from your input or output. The text you paste into the editor, the files
        you open, and the results you copy out never leave your device.
      </p>
      <p className="mb-4 leading-relaxed text-fg-secondary">
        The only data we receive is aggregate, anonymous traffic information via{' '}
        <ExternalLink href="https://plausible.io">Plausible Analytics</ExternalLink>. Specifically,
        Plausible records:
      </p>
      <ul className="mb-4 space-y-1.5 pl-5 text-fg-secondary">
        <li className="list-disc leading-relaxed">
          Page URL (e.g. <Code>/json-formatter</Code>) and referrer source
        </li>
        <li className="list-disc leading-relaxed">
          Browser name, OS, and approximate country (derived from IP, then discarded — the IP itself
          is never stored)
        </li>
        <li className="list-disc leading-relaxed">Whether the visit came from a mobile device</li>
      </ul>
      <p className="mb-4 leading-relaxed text-fg-secondary">
        Plausible does <strong className="font-semibold text-fg">not</strong> use cookies, does not
        fingerprint your browser, does not track you across sites, and is fully GDPR compliant. Data
        is hosted in the EU. You can read their full data policy at{' '}
        <ExternalLink href="https://plausible.io/data-policy">
          plausible.io/data-policy
        </ExternalLink>
        .
      </p>

      {/* How processing works */}
      <SectionHeading>How processing works</SectionHeading>
      <p className="mb-4 leading-relaxed text-fg-secondary">
        formatvault is a static web application. When you visit a tool page, your browser downloads
        the JavaScript bundle from our CDN and executes it locally. From that point on, all
        processing is self-contained:
      </p>
      <ul className="mb-4 space-y-1.5 pl-5 text-fg-secondary">
        <li className="list-disc leading-relaxed">
          JSON is parsed and formatted using native <Code>JSON.parse</Code> /{' '}
          <Code>JSON.stringify</Code> (or <Code>json5</Code> for relaxed syntax)
        </li>
        <li className="list-disc leading-relaxed">
          CSV is processed by <Code>papaparse</Code> running in a Web Worker — large files never
          block the main thread and never touch a server
        </li>
        <li className="list-disc leading-relaxed">
          JWT tokens are decoded with <Code>jose</Code> entirely in-memory — the signature is not
          verified, and the token payload is not transmitted
        </li>
        <li className="list-disc leading-relaxed">
          Base64 strings are encoded/decoded with <Code>js-base64</Code>; URL strings use native{' '}
          <Code>encodeURIComponent</Code> / <Code>decodeURIComponent</Code>
        </li>
        <li className="list-disc leading-relaxed">
          Markdown is rendered by <Code>marked</Code> then sanitised through <Code>DOMPurify</Code>{' '}
          before display — no raw HTML is ever injected
        </li>
      </ul>
      <p className="mb-4 leading-relaxed text-fg-secondary">
        Files larger than 1 MB are processed in a dedicated Web Worker using a streaming parser so
        that your data is handled efficiently without any network round-trips. Sensitive payloads —
        API responses, authentication tokens, configuration files, financial CSVs — can be pasted
        with confidence.
      </p>

      {/* localStorage */}
      <SectionHeading>localStorage</SectionHeading>
      <p className="mb-4 leading-relaxed text-fg-secondary">
        We write two preference keys to <Code>localStorage</Code>:
      </p>
      <ul className="mb-4 space-y-1.5 pl-5 text-fg-secondary">
        <li className="list-disc leading-relaxed">
          <Code>fv-theme</Code> — your colour scheme preference (<Code>"dark"</Code> or{' '}
          <Code>"light"</Code>)
        </li>
        <li className="list-disc leading-relaxed">
          <Code>fv-settings</Code> — editor preferences such as indent size and tab style
        </li>
      </ul>
      <p className="mb-4 leading-relaxed text-fg-secondary">
        Input content — the text you type or paste into any editor — is <em>never</em> written to{' '}
        <Code>localStorage</Code> or any other browser storage API. It exists only in JavaScript
        memory for the duration of your session and is discarded when you navigate away or close the
        tab.
      </p>
      <p className="leading-relaxed text-fg-secondary">
        You can clear all formatvault preferences at any time from your browser's developer tools
        (Application → Local Storage) or by clearing site data in your browser settings.
      </p>

      {/* Third-party services */}
      <SectionHeading>Third-party services</SectionHeading>

      <h3 className="mb-2 mt-6 text-sm font-semibold uppercase tracking-wider text-fg-secondary">
        Plausible Analytics
      </h3>
      <p className="mb-4 leading-relaxed text-fg-secondary">
        Page view analytics via{' '}
        <ExternalLink href="https://plausible.io">plausible.io</ExternalLink>. Cookieless, no
        personal data stored, GDPR/CCPA compliant, EU-hosted. The script is loaded from{' '}
        <Code>plausible.io/js/script.js</Code> and sends a single event per page navigation
        containing only the page path and the data listed under "What we collect" above.
      </p>

      <h3 className="mb-2 mt-6 text-sm font-semibold uppercase tracking-wider text-fg-secondary">
        Google Fonts
      </h3>
      <p className="mb-4 leading-relaxed text-fg-secondary">
        Fonts (DM Sans, JetBrains Mono, Geist) are loaded from{' '}
        <ExternalLink href="https://fonts.google.com">fonts.googleapis.com</ExternalLink>. This
        means your browser makes a request to Google's CDN when you first visit the site. Google may
        log the request IP address and user-agent as part of standard CDN operation. We have no
        control over that data. If you prefer not to contact Google's servers, you can block the
        domain in your browser — the site will fall back to system fonts.
      </p>

      <h3 className="mb-2 mt-6 text-sm font-semibold uppercase tracking-wider text-fg-secondary">
        Cloudflare Pages
      </h3>
      <p className="mb-4 leading-relaxed text-fg-secondary">
        The site is hosted on Cloudflare Pages and served through Cloudflare's CDN. Cloudflare
        processes HTTP requests in order to serve assets and provides DDoS protection and edge
        caching. Cloudflare may log request metadata (IP, headers) for security and operational
        purposes in accordance with their own privacy policy. No application-level user data is
        accessible to or stored by Cloudflare.
      </p>

      {/* Your rights */}
      <SectionHeading>Your rights</SectionHeading>
      <p className="mb-4 leading-relaxed text-fg-secondary">
        Under GDPR, CCPA, and similar regulations you have rights to access, correct, delete, and
        export personal data held about you. Because formatvault does not collect or store any
        personal data about individual users, these rights are trivially satisfied — there is
        nothing for us to provide, correct, or delete.
      </p>
      <p className="leading-relaxed text-fg-secondary">
        The only aggregate analytics data we hold (via Plausible) is not linked to any individual
        and cannot identify you. If you have questions about what Plausible holds, refer to their{' '}
        <ExternalLink href="https://plausible.io/privacy">privacy policy</ExternalLink>.
      </p>

      {/* Contact */}
      <SectionHeading>Contact</SectionHeading>
      <p className="leading-relaxed text-fg-secondary">
        Questions about this policy? Email{' '}
        <a
          href="mailto:privacy@formatvault.dev"
          className="text-brand-indigo underline-offset-2 hover:underline"
        >
          privacy@formatvault.dev
        </a>
        . We'll respond within a reasonable time.
      </p>
    </div>
  );
}
