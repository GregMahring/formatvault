import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router';
import { Moon, Sun, ChevronDown, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useSettingsStore } from '@/stores/settingsStore';
import { cn } from '@/lib/utils';
import { NAV_GROUPS } from '@/lib/routes';

export interface HeaderProps {
  className?: string;
  onOpenCommandPalette?: () => void;
}

interface NavGroupProps {
  label: string;
  items: readonly { to: string; label: string }[];
}

// ── Desktop dropdown ──────────────────────────────────────────────────────────

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
        aria-haspopup="menu"
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
        <div className="absolute left-0 top-full z-50 pt-1">
          <div
            role="menu"
            className="min-w-[200px] rounded-md border border-edge bg-surface-raised py-1 shadow-xl shadow-black/20"
          >
            {items.map(({ to, label: itemLabel }) => (
              <NavLink
                key={to}
                to={to}
                role="menuitem"
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
        </div>
      )}
    </div>
  );
}

// ── Mobile accordion group ────────────────────────────────────────────────────

function MobileNavGroup({ label, items, onClose }: NavGroupProps & { onClose: () => void }) {
  const location = useLocation();
  const isActive = items.some((item) => location.pathname.startsWith(item.to));
  const [expanded, setExpanded] = useState(isActive);

  return (
    <div className="border-b border-edge">
      <button
        type="button"
        aria-expanded={expanded}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium transition-colors"
        onClick={() => {
          setExpanded((v) => !v);
        }}
      >
        <span className={isActive ? 'text-brand-indigo' : 'text-fg-secondary'}>{label}</span>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-fg-secondary transition-transform duration-150',
            expanded && 'rotate-180'
          )}
          aria-hidden="true"
        />
      </button>
      {expanded && (
        <div className="pb-2">
          {items.map(({ to, label: itemLabel }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive: linkActive }) =>
                cn(
                  'block px-6 py-1.5 font-mono text-xs transition-colors',
                  linkActive ? 'text-brand-indigo' : 'text-fg-secondary hover:text-fg'
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

// ── Header ────────────────────────────────────────────────────────────────────

export function Header({ className, onOpenCommandPalette }: HeaderProps) {
  const { theme, setTheme } = useSettingsStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-50 flex h-14 items-center gap-4 border-b border-edge bg-surface/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-surface/80',
          className
        )}
      >
        {/* Logo */}
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

        {/* Desktop: separator + nav */}
        <div className="hidden h-4 w-px bg-surface-elevated md:block" aria-hidden="true" />
        <nav aria-label="Main navigation" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {NAV_GROUPS.map((group) => (
              <li key={group.label}>
                <NavGroup label={group.label} items={group.items} />
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex-1" />

        {/* Command palette — desktop only */}
        {onOpenCommandPalette && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onOpenCommandPalette}
                className="hidden items-center gap-1.5 rounded-md border border-edge bg-surface-raised px-2.5 py-1 text-xs text-fg-secondary transition-colors hover:border-edge-emphasis hover:text-fg md:flex"
              >
                Search commands
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

        {/* Hamburger — mobile only */}
        <button
          type="button"
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-menu"
          onClick={() => {
            setMobileMenuOpen((v) => !v);
          }}
          className="flex items-center justify-center rounded-md p-1.5 text-fg-secondary transition-colors hover:bg-surface-elevated hover:text-fg md:hidden"
        >
          {mobileMenuOpen ? (
            <X className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Menu className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
      </header>

      {/* Mobile menu drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden" id="mobile-menu">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            aria-hidden="true"
            onClick={() => {
              setMobileMenuOpen(false);
            }}
          />

          {/* Drawer panel */}
          <div className="absolute bottom-0 left-0 right-0 top-14 w-72 overflow-y-auto border-r border-edge bg-surface shadow-xl">
            <nav aria-label="Mobile navigation">
              {NAV_GROUPS.map((group) => (
                <MobileNavGroup
                  key={group.label}
                  label={group.label}
                  items={group.items}
                  onClose={() => {
                    setMobileMenuOpen(false);
                  }}
                />
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
