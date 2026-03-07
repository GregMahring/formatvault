import { Suspense } from 'react';
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router';
import { AppLayout } from '@/components/AppLayout';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import './app.css';

/** Inline script to restore persisted theme before first paint — prevents flash of wrong theme. */
const themeInitScript = `
(function(){try{var s=JSON.parse(localStorage.getItem('formatvault-settings')||'{}');var t=s.state&&s.state.theme==='light'?'light':'dark';document.documentElement.classList.remove('dark','light');document.documentElement.classList.add(t);document.documentElement.style.colorScheme=t;}catch(e){}})();
`.trim();

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Restore persisted theme before paint to avoid flash of wrong theme */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
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
