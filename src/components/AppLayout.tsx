import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { AdSidebar } from '@/components/AdSidebar';

// Lazy-loaded: only fetched when user first opens the palette (Cmd+K or header button).
// Keeps @radix-ui/react-dialog out of the root bundle.
const CommandPalette = lazy(() =>
  import('@/components/CommandPalette').then((m) => ({ default: m.CommandPalette }))
);
import { useCommandStore, type Command } from '@/stores/commandStore';
import { useSettingsStore, type IndentSize } from '@/stores/settingsStore';
import { TOOL_ROUTES } from '@/lib/routes';
import { Home, ArrowLeftRight, Sun, Moon, WrapText, Indent } from 'lucide-react';

export interface AppLayoutProps {
  children: React.ReactNode;
}

/**
 * Top-level app shell — wraps every page.
 * Provides TooltipProvider, global command palette, and static command registration.
 */
/**
 * Pages that get the full-width layout (no sidebars).
 * Everything else is a tool page and gets the two-sidebar layout.
 */
const FULL_WIDTH_PATHS = new Set(['/', '/about', '/privacy', '/converters']);

export function AppLayout({ children }: AppLayoutProps) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  // Gate that defers mounting CommandPalette until first user intent — avoids
  // loading @radix-ui/react-dialog on initial page render.
  const [paletteEverOpened, setPaletteEverOpened] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isToolPage = !FULL_WIDTH_PATHS.has(location.pathname);
  const { theme, setTheme, indentSize, setIndentSize, wordWrap, setWordWrap } = useSettingsStore();

  // Global Cmd+K handler — capture phase fires before per-route handlers
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k' && !e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        setPaletteEverOpened(true);
        setPaletteOpen(true);
      }
    };
    document.addEventListener('keydown', handler, true);
    return () => {
      document.removeEventListener('keydown', handler, true);
    };
  }, []);

  // Static commands — re-created when settings change so labels stay current
  const staticCommands: Command[] = useMemo(
    () => [
      // ── Navigation ──────────────────────────────────────────────
      {
        id: 'nav:home',
        label: 'Home',
        group: 'Navigation',
        icon: Home,
        handler: () => {
          void navigate('/');
        },
      },
      {
        id: 'nav:converters',
        label: 'Converters',
        group: 'Navigation',
        icon: ArrowLeftRight,
        keywords: ['convert', 'transform'],
        handler: () => {
          void navigate('/converters');
        },
      },
      ...TOOL_ROUTES.map((route) => ({
        id: `nav:${route.id}`,
        label: route.label,
        group: 'Navigation' as const,
        icon: route.icon,
        keywords: route.keywords ? [...route.keywords] : undefined,
        handler: () => {
          void navigate(route.path);
        },
      })),

      // ── Settings ────────────────────────────────────────────────
      {
        id: 'settings:toggle-theme',
        label: `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`,
        group: 'Settings',
        icon: theme === 'dark' ? Sun : Moon,
        keywords: ['theme', 'dark', 'light'],
        handler: () => {
          setTheme(theme === 'dark' ? 'light' : 'dark');
        },
      },
      {
        id: 'settings:indent-2',
        label: 'Set indent to 2 spaces',
        group: 'Settings',
        icon: Indent,
        keywords: ['indent', 'spacing'],
        handler: () => {
          setIndentSize(2 as IndentSize);
        },
      },
      {
        id: 'settings:indent-4',
        label: 'Set indent to 4 spaces',
        group: 'Settings',
        icon: Indent,
        keywords: ['indent', 'spacing'],
        handler: () => {
          setIndentSize(4 as IndentSize);
        },
      },
      {
        id: 'settings:indent-8',
        label: 'Set indent to 8 spaces',
        group: 'Settings',
        icon: Indent,
        keywords: ['indent', 'spacing'],
        handler: () => {
          setIndentSize(8 as IndentSize);
        },
      },
      {
        id: 'settings:toggle-word-wrap',
        label: `${wordWrap ? 'Disable' : 'Enable'} word wrap`,
        group: 'Settings',
        icon: WrapText,
        keywords: ['wrap', 'line'],
        handler: () => {
          setWordWrap(!wordWrap);
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [navigate, theme, indentSize, wordWrap]
  );

  useEffect(() => {
    useCommandStore.getState().register(staticCommands);
  }, [staticCommands]);

  const handlePaletteOpen = useCallback((open: boolean) => {
    setPaletteOpen(open);
  }, []);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-screen flex-col bg-surface">
        {/* Skip-to-content link — WCAG 2.1 AA requirement */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-accent-600 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
        >
          Skip to main content
        </a>

        <Header
          onOpenCommandPalette={() => {
            setPaletteEverOpened(true);
            setPaletteOpen(true);
          }}
        />

        <main
          id="main-content"
          className={
            isToolPage
              ? 'flex min-h-0 flex-1 flex-row'
              : 'flex min-h-0 flex-1 flex-col overflow-y-auto'
          }
        >
          {isToolPage ? (
            <>
              <AdSidebar side="left" />
              <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">{children}</div>
              <AdSidebar side="right" />
            </>
          ) : (
            children
          )}
        </main>

        <Footer />

        {paletteEverOpened && (
          <Suspense fallback={null}>
            <CommandPalette open={paletteOpen} onOpenChange={handlePaletteOpen} />
          </Suspense>
        )}
      </div>
    </TooltipProvider>
  );
}
