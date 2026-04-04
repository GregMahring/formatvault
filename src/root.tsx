import { Suspense } from 'react';
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router';
import { AppLayout } from '@/components/AppLayout';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LoadingSpinner } from '@/components/LoadingSpinner';
// ?inline embeds the processed CSS as a string so we can inject it via a <style>
// tag in the SSR HTML rather than a render-blocking <link rel="stylesheet">.
import appStyles from './app.css?inline';

/** Inline script to restore persisted theme before first paint — prevents flash of wrong theme. */
const themeInitScript = `
(function(){try{var s=JSON.parse(localStorage.getItem('formatvault-settings')||'{}');var t=s.state&&s.state.theme==='light'?'light':'dark';document.documentElement.classList.remove('dark','light');document.documentElement.classList.add(t);document.documentElement.style.colorScheme=t;}catch(e){}})();
`.trim();

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        {/* Inline CSS — eliminates render-blocking external stylesheet and the
            network dependency chain. Safe: content is our own build output. */}
        <style dangerouslySetInnerHTML={{ __html: appStyles }} />
        {/* Restore persisted theme before paint to avoid flash of wrong theme */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        {/* Brand fonts — JetBrains Mono, DM Sans, Geist
            Non-blocking: preconnect warms the connection, media="print" + onLoad swap
            prevents render-blocking without a preload that creates a critical chain. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Geist:wght@400;500;600;700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap"
          media="print"
          onLoad={(e) => {
            (e.currentTarget as HTMLLinkElement).media = 'all';
          }}
        />
        {/* Plausible Analytics — privacy-respecting, no cookies, no PII */}
        <script defer data-domain="formatvault.dev" src="https://plausible.io/js/script.js" />
        <Meta />
        <Links />
      </head>
      <body className="bg-surface text-fg antialiased">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppLayout>
        <Suspense
          fallback={
            <div className="flex h-full items-center justify-center">
              <LoadingSpinner label="Loading tool…" />
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </AppLayout>
    </ErrorBoundary>
  );
}
