import { NavLink } from 'react-router';
import { cn } from '@/lib/utils';

export interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps) {
  return (
    <footer
      className={cn(
        'flex h-10 items-center justify-between border-t border-edge bg-surface px-4 text-xs text-fg-secondary',
        className
      )}
    >
      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
        {/* Phones get only the headline promise so the footer stays one line;
            the header already carries the logo there. */}
        <p className="min-w-0 truncate">
          <span aria-hidden="true">🔒</span>{' '}
          <strong className="font-medium text-fg">No data leaves your browser.</strong>
          <span className="hidden md:inline"> All processing is 100% client-side.</span>
        </p>
        <NavLink to="/about" className="shrink-0 transition-colors hover:text-fg">
          About
        </NavLink>
        <NavLink to="/privacy" className="shrink-0 transition-colors hover:text-fg">
          Privacy
        </NavLink>
      </div>
      <NavLink
        to="/"
        className="ml-4 hidden shrink-0 items-center font-mono text-sm leading-none md:flex"
        aria-label="formatvault home"
      >
        <span className="mr-[5px] font-bold text-brand-indigo">$</span>
        <span className="font-normal text-logo-cyan">{'{'}</span>
        <span className="font-bold text-logo-silver">format</span>
        <span className="font-bold text-logo-colon">:</span>
        <span className="font-bold text-logo-silver">vault</span>
        <span className="font-normal text-logo-cyan">{'}'}</span>
        <span
          className="fv-cursor ml-[3px] inline-block h-[13px] w-[2px] bg-brand-indigo align-middle"
          aria-hidden="true"
        />
      </NavLink>
    </footer>
  );
}
