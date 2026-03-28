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
      <div className="flex items-center gap-4">
        <p>
          <span aria-hidden="true">🔒</span>{' '}
          <strong className="font-medium text-fg">No data leaves your browser.</strong> All
          processing is 100% client-side.
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
        className="flex items-center font-mono text-sm leading-none"
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
