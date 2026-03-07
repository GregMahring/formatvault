import { NavLink } from 'react-router';
import { Moon, Sun, Braces } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useSettingsStore } from '@/stores/settingsStore';
import { cn } from '@/lib/utils';

export interface HeaderProps {
  className?: string;
  /** Callback to open the global command palette */
  onOpenCommandPalette?: () => void;
}

const NAV_LINKS = [
  { to: '/json-formatter', label: 'JSON' },
  { to: '/csv-formatter', label: 'CSV' },
  { to: '/yaml-formatter', label: 'YAML' },
  { to: '/toml-formatter', label: 'TOML' },
  { to: '/sql-formatter', label: 'SQL' },
  { to: '/regex-tester', label: 'Regex' },
  { to: '/converters', label: 'Convert' },
  { to: '/jwt-decoder', label: 'JWT' },
  { to: '/base64-encoder', label: 'Base64' },
  { to: '/url-encoder', label: 'URL' },
  { to: '/unix-timestamp-converter', label: 'Timestamp' },
  { to: '/cron-expression-explainer', label: 'Cron' },
  { to: '/color-picker', label: 'Color' },
  { to: '/number-base-converter', label: 'Base' },
] as const;

export function Header({ className, onOpenCommandPalette }: HeaderProps) {
  const { theme, setTheme } = useSettingsStore();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-50 flex h-12 items-center gap-4 border-b border-gray-800 bg-gray-950/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-gray-950/80',
        className
      )}
    >
      {/* Logo */}
      <NavLink
        to="/"
        className="flex items-center gap-2 text-sm font-semibold text-gray-100 hover:text-white"
        aria-label="formatvault home"
      >
        <Braces className="h-4 w-4 text-accent-400" aria-hidden="true" />
        <span>formatvault</span>
      </NavLink>

      <div className="h-4 w-px bg-gray-800" aria-hidden="true" />

      {/* Primary nav */}
      <nav aria-label="Main navigation">
        <ul className="flex items-center gap-1">
          {NAV_LINKS.map(({ to, label }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  cn(
                    'rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
                    isActive
                      ? 'bg-gray-800 text-gray-100'
                      : 'text-gray-400 hover:bg-gray-800/60 hover:text-gray-200'
                  )
                }
              >
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Command palette trigger */}
      {onOpenCommandPalette && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onOpenCommandPalette}
              className="flex items-center gap-1.5 rounded-md border border-gray-800 bg-gray-900 px-2.5 py-1 text-xs text-gray-400 transition-colors hover:border-gray-700 hover:text-gray-300"
              aria-label="Search commands"
            >
              <span className="hidden sm:inline">Search commands</span>
              <kbd className="rounded border border-gray-700 bg-gray-800 px-1 py-0.5 text-[10px] font-medium text-gray-400">
                ⌘K
              </kbd>
            </button>
          </TooltipTrigger>
          <TooltipContent>Command palette (⌘K)</TooltipContent>
        </Tooltip>
      )}

      {/* Theme toggle */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-gray-400" aria-hidden="true" />
            ) : (
              <Moon className="h-4 w-4 text-gray-400" aria-hidden="true" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</TooltipContent>
      </Tooltip>
    </header>
  );
}
