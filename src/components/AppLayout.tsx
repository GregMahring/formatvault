import { TooltipProvider } from '@/components/ui/tooltip';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export interface AppLayoutProps {
  children: React.ReactNode;
}

/**
 * Top-level app shell — wraps every page.
 * Provides TooltipProvider (required by Radix Tooltip) at the root.
 */
export function AppLayout({ children }: AppLayoutProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-screen flex-col bg-gray-950">
        {/* Skip-to-content link — WCAG 2.1 AA requirement */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-accent-600 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
        >
          Skip to main content
        </a>

        <Header />

        <main id="main-content" className="flex min-h-0 flex-1 flex-col">
          {children}
        </main>

        <Footer />
      </div>
    </TooltipProvider>
  );
}
