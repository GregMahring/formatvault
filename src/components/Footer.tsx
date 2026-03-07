import { cn } from '@/lib/utils';

export interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps) {
  return (
    <footer
      className={cn(
        'flex h-10 items-center justify-between border-t border-edge bg-surface px-4 text-xs text-fg-tertiary',
        className
      )}
    >
      <p>
        <span className="text-fg-muted">🔒</span>{' '}
        <strong className="font-medium text-fg-secondary">No data leaves your browser.</strong> All
        processing is 100% client-side.
      </p>
      <nav aria-label="Footer navigation">
        <ul className="flex items-center gap-4">
          <li>
            <a
              href="https://github.com/gregmahring/formatvault"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-fg transition-colors"
            >
              GitHub
            </a>
          </li>
          <li>
            <span>© {new Date().getFullYear()} formatvault</span>
          </li>
        </ul>
      </nav>
    </footer>
  );
}
