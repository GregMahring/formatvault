import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CommandPalette } from '@/components/CommandPalette';
import { useCommandStore, type Command } from '@/stores/commandStore';
import { useSettingsStore, type IndentSize } from '@/stores/settingsStore';
import {
  Home,
  Braces,
  FileText,
  FileCode2,
  ArrowLeftRight,
  KeyRound,
  Lock,
  Globe,
  Sun,
  Moon,
  WrapText,
  Zap,
  Indent,
  Database,
  Slash,
  Timer,
  CalendarClock,
  Pipette,
  Binary,
} from 'lucide-react';

export interface AppLayoutProps {
  children: React.ReactNode;
}

/**
 * Top-level app shell — wraps every page.
 * Provides TooltipProvider, global command palette, and static command registration.
 */
export function AppLayout({ children }: AppLayoutProps) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const navigate = useNavigate();
  const {
    theme,
    setTheme,
    indentSize,
    setIndentSize,
    wordWrap,
    setWordWrap,
    autoFormat,
    setAutoFormat,
  } = useSettingsStore();

  // Global Cmd+K handler — capture phase fires before per-route handlers
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k' && !e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
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
        id: 'nav:json-formatter',
        label: 'JSON Formatter',
        group: 'Navigation',
        icon: Braces,
        keywords: ['pretty', 'beautify', 'validate', 'minify'],
        handler: () => {
          void navigate('/json-formatter');
        },
      },
      {
        id: 'nav:csv-formatter',
        label: 'CSV Formatter',
        group: 'Navigation',
        icon: FileText,
        keywords: ['delimiter', 'comma', 'tab'],
        handler: () => {
          void navigate('/csv-formatter');
        },
      },
      {
        id: 'nav:yaml-formatter',
        label: 'YAML Formatter',
        group: 'Navigation',
        icon: FileCode2,
        keywords: ['yml'],
        handler: () => {
          void navigate('/yaml-formatter');
        },
      },
      {
        id: 'nav:toml-formatter',
        label: 'TOML Formatter',
        group: 'Navigation',
        icon: FileCode2,
        keywords: ['cargo', 'pyproject', 'config'],
        handler: () => {
          void navigate('/toml-formatter');
        },
      },
      {
        id: 'nav:sql-formatter',
        label: 'SQL Formatter',
        group: 'Navigation',
        icon: Database,
        keywords: ['query', 'database', 'select', 'postgres', 'mysql'],
        handler: () => {
          void navigate('/sql-formatter');
        },
      },
      {
        id: 'nav:regex-tester',
        label: 'Regex Tester',
        group: 'Navigation',
        icon: Slash,
        keywords: ['regexp', 'pattern', 'match', 'test'],
        handler: () => {
          void navigate('/regex-tester');
        },
      },
      {
        id: 'nav:unix-timestamp-converter',
        label: 'Unix Timestamp Converter',
        group: 'Navigation',
        icon: Timer,
        keywords: ['timestamp', 'unix', 'epoch', 'date', 'time', 'seconds', 'milliseconds'],
        handler: () => {
          void navigate('/unix-timestamp-converter');
        },
      },
      {
        id: 'nav:cron-expression-explainer',
        label: 'Cron Expression Explainer',
        group: 'Navigation',
        icon: CalendarClock,
        keywords: ['cron', 'schedule', 'recurring', 'job', 'task', 'cronjob', 'next run'],
        handler: () => {
          void navigate('/cron-expression-explainer');
        },
      },
      {
        id: 'nav:color-picker',
        label: 'Color Picker',
        group: 'Navigation',
        icon: Pipette,
        keywords: ['color', 'colour', 'hex', 'rgb', 'hsl', 'oklch', 'picker', 'converter'],
        handler: () => {
          void navigate('/color-picker');
        },
      },
      {
        id: 'nav:number-base-converter',
        label: 'Number Base Converter',
        group: 'Navigation',
        icon: Binary,
        keywords: ['binary', 'hex', 'octal', 'decimal', 'base', 'bits', 'number', 'convert'],
        handler: () => {
          void navigate('/number-base-converter');
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
      {
        id: 'nav:jwt-decoder',
        label: 'JWT Decoder',
        group: 'Navigation',
        icon: KeyRound,
        keywords: ['token', 'decode'],
        handler: () => {
          void navigate('/jwt-decoder');
        },
      },
      {
        id: 'nav:base64-encoder',
        label: 'Base64 Encoder',
        group: 'Navigation',
        icon: Lock,
        keywords: ['encode', 'decode', 'base64'],
        handler: () => {
          void navigate('/base64-encoder');
        },
      },
      {
        id: 'nav:url-encoder',
        label: 'URL Encoder',
        group: 'Navigation',
        icon: Globe,
        keywords: ['percent', 'encode', 'decode', 'query'],
        handler: () => {
          void navigate('/url-encoder');
        },
      },

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
      {
        id: 'settings:toggle-auto-format',
        label: `${autoFormat ? 'Disable' : 'Enable'} auto-format`,
        group: 'Settings',
        icon: Zap,
        keywords: ['auto', 'format'],
        handler: () => {
          setAutoFormat(!autoFormat);
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [navigate, theme, indentSize, wordWrap, autoFormat]
  );

  useEffect(() => {
    useCommandStore.getState().register(staticCommands);
  }, [staticCommands]);

  const handlePaletteOpen = useCallback((open: boolean) => {
    setPaletteOpen(open);
  }, []);

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

        <Header
          onOpenCommandPalette={() => {
            setPaletteOpen(true);
          }}
        />

        <main id="main-content" className="flex min-h-0 flex-1 flex-col">
          {children}
        </main>

        <Footer />

        <CommandPalette open={paletteOpen} onOpenChange={handlePaletteOpen} />
      </div>
    </TooltipProvider>
  );
}
