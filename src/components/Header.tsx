import { useState } from 'react';
import { NavLink, useLocation } from 'react-router';
import { Moon, Sun, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useSettingsStore } from '@/stores/settingsStore';
import { cn } from '@/lib/utils';

export interface HeaderProps {
  className?: string;
  onOpenCommandPalette?: () => void;
}

const NAV_GROUPS = [
  {
    label: 'Formatters',
    items: [
      { to: '/json-formatter', label: 'JSON Formatter' },
      { to: '/csv-formatter', label: 'CSV Formatter' },
      { to: '/yaml-formatter', label: 'YAML Formatter' },
      { to: '/toml-formatter', label: 'TOML Formatter' },
      { to: '/sql-formatter', label: 'SQL Formatter' },
    ],
  },
  {
    label: 'Converters',
    items: [
      { to: '/json-to-csv-converter', label: 'JSON → CSV' },
      { to: '/json-to-yaml-converter', label: 'JSON → YAML' },
      { to: '/json-to-toml-converter', label: 'JSON → TOML' },
      { to: '/json-to-typescript', label: 'JSON → TypeScript' },
      { to: '/csv-to-json-converter', label: 'CSV → JSON' },
      { to: '/csv-to-yaml-converter', label: 'CSV → YAML' },
      { to: '/yaml-to-json-converter', label: 'YAML → JSON' },
      { to: '/yaml-to-toml-converter', label: 'YAML → TOML' },
      { to: '/toml-to-json-converter', label: 'TOML → JSON' },
      { to: '/toml-to-yaml-converter', label: 'TOML → YAML' },
    ],
  },
  {
    label: 'Utilities',
    items: [
      { to: '/regex-tester', label: 'Regex Tester' },
      { to: '/jwt-decoder', label: 'JWT Decoder' },
      { to: '/base64-encoder', label: 'Base64 Encoder' },
      { to: '/url-encoder', label: 'URL Encoder' },
      { to: '/unix-timestamp-converter', label: 'Timestamp Converter' },
      { to: '/cron-expression-explainer', label: 'Cron Explainer' },
      { to: '/color-picker', label: 'Color Picker' },
      { to: '/number-base-converter', label: 'Number Base Converter' },
      { to: '/hash-generator', label: 'Hash Generator' },
      { to: '/json-schema-generator', label: 'JSON Schema Generator' },
    ],
  },
] as const;

interface NavGroupProps {
  label: string;
  items: readonly { to: string; label: string }[];
}

function NavGroup({ label, items }: NavGroupProps) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const isActive = items.some((item) => location.pathname.startsWith(item.to));

  return (
    <div
      className="relative"
      onMouseEnter={() => {
        setOpen(true);
      }}
      onMouseLeave={() => {
        setOpen(false);
      }}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        className={cn(
          'flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
          isActive || open
            ? 'bg-surface-elevated text-fg'
            : 'text-fg-secondary hover:bg-surface-elevated/60 hover:text-fg'
        )}
      >
        {label}
        <ChevronDown
          className={cn('h-3 w-3 transition-transform duration-150', open && 'rotate-180')}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 min-w-[200px] rounded-md border border-edge bg-surface-raised py-1 shadow-xl shadow-black/20">
          {items.map(({ to, label: itemLabel }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => {
                setOpen(false);
              }}
              className={({ isActive: linkActive }) =>
                cn(
                  'block px-3 py-1.5 font-mono text-xs transition-colors',
                  linkActive
                    ? 'text-brand-indigo'
                    : 'text-fg-secondary hover:bg-surface-elevated hover:text-fg'
                )
              }
            >
              {itemLabel}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

export function Header({ className, onOpenCommandPalette }: HeaderProps) {
  const { theme, setTheme } = useSettingsStore();

  return (
    <header
      className={cn(
        'sticky top-0 z-50 flex h-14 items-center gap-4 border-b border-edge bg-surface/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-surface/80',
        className
      )}
    >
      {/* Logo — $ {format:vault}█ */}
      <NavLink
        to="/"
        className="flex items-center font-mono text-base leading-none"
        aria-label="formatvault home"
      >
        <span className="mr-[6px] font-bold text-brand-indigo">$</span>
        <span className="font-normal text-logo-cyan">{'{'}</span>
        <span className="font-bold text-logo-silver">format</span>
        <span className="font-bold text-logo-colon">:</span>
        <span className="font-bold text-logo-silver">vault</span>
        <span className="font-normal text-logo-cyan">{'}'}</span>
        <span
          className="fv-cursor ml-[3px] inline-block h-[15px] w-[2px] bg-brand-indigo align-middle"
          aria-hidden="true"
        />
      </NavLink>

      <div className="h-4 w-px bg-surface-elevated" aria-hidden="true" />

      {/* Primary nav */}
      <nav aria-label="Main navigation">
        <ul className="flex items-center gap-1">
          {NAV_GROUPS.map((group) => (
            <li key={group.label}>
              <NavGroup label={group.label} items={group.items} />
            </li>
          ))}
        </ul>
      </nav>

      <div className="flex-1" />

      {/* Command palette trigger */}
      {onOpenCommandPalette && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onOpenCommandPalette}
              className="flex items-center gap-1.5 rounded-md border border-edge bg-surface-raised px-2.5 py-1 text-xs text-fg-secondary transition-colors hover:border-edge-emphasis hover:text-fg"
              aria-label="Search commands"
            >
              <span className="hidden sm:inline">Search commands</span>
              <kbd className="rounded border border-edge-emphasis bg-surface-elevated px-1 py-0.5 text-[10px] font-medium text-fg-secondary">
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
            onClick={() => {
              setTheme(theme === 'dark' ? 'light' : 'dark');
            }}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-fg-secondary" aria-hidden="true" />
            ) : (
              <Moon className="h-4 w-4 text-fg-secondary" aria-hidden="true" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</TooltipContent>
      </Tooltip>
    </header>
  );
}
